'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { SurfReport, NearbySpot } from '@/app/lib/types'
import { formatWaveHeight } from '@/app/lib/utils'
import { useTheme } from '@/app/components/ThemeProvider'
import { THEMES } from '@/app/lib/themes'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  report: SurfReport
  units: { height: 'ft' | 'm' }
  highlightLayers?: Set<string>
  nearbySpots?: NearbySpot[]
  onSpotSelect?: (spot: NearbySpot) => void
}

// ── Geodesy ────────────────────────────────────────────────────────────────────
function offset(lat: number, lon: number, bearingDeg: number, distKm: number) {
  const R = 6371
  const b = (bearingDeg * Math.PI) / 180
  const φ1 = (lat * Math.PI) / 180
  const λ1 = (lon * Math.PI) / 180
  const d = distKm / R
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(b))
  const λ2 = λ1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2))
  return { lat: (φ2 * 180) / Math.PI, lon: (λ2 * 180) / Math.PI }
}

// ── Land clipping ──────────────────────────────────────────────────────────────
interface LandRing {
  coords: [number, number][]                    // GeoJSON order: [lon, lat]
  bbox:   [number, number, number, number]      // [minLon, minLat, maxLon, maxLat]
}

function extractLandRings(geojson: { features: { geometry: { type: string; coordinates: any } }[] }): LandRing[] {
  const rings: LandRing[] = []
  const addRing = (coords: [number, number][]) => {
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon; if (lat < minLat) minLat = lat
      if (lon > maxLon) maxLon = lon; if (lat > maxLat) maxLat = lat
    }
    rings.push({ coords, bbox: [minLon, minLat, maxLon, maxLat] })
  }
  for (const f of geojson.features ?? []) {
    const { type, coordinates } = f.geometry
    if (type === 'Polygon')      for (const r of coordinates)       addRing(r)
    if (type === 'MultiPolygon') for (const p of coordinates) for (const r of p) addRing(r)
  }
  return rings
}

function pointOnLand(lon: number, lat: number, rings: LandRing[]): boolean {
  for (const { coords, bbox } of rings) {
    if (lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue
    let inside = false
    const n = coords.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = coords[i], [xj, yj] = coords[j]
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
        inside = !inside
    }
    if (inside) return true
  }
  return false
}

// Module-level cache — fetched once per browser session, shared across map rebuilds
let _landRings: LandRing[] | null = null
let _landFetch: Promise<LandRing[]> | null = null

function getLandRings(): Promise<LandRing[]> {
  if (_landRings) return Promise.resolve(_landRings)
  if (!_landFetch) {
    _landFetch = fetch(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson',
    )
      .then(r => r.json())
      .then((gj) => { _landRings = extractLandRings(gj); return _landRings })
      .catch(() => [])
  }
  return _landFetch
}

// ── Directional arc pulses ─────────────────────────────────────────────────────
// Places a virtual swell source far offshore in the FROM direction. Draws
// numArcs concentric partial-circle arcs centred on that source. Each arc has a
// CSS class (classPrefix-0…3) that the <style> block animates with staggered
// delays — farthest arc pulses first, nearest last — creating a wave-train
// marching toward shore. Weight increases near-shore for depth-of-field feel.
// If landRings is provided, arcs are clipped to ocean-only segments.
function addDirectionalArcs(
  map: L.Map,
  lat: number,
  lon: number,
  fromDeg: number,
  color: string,
  classPrefix: string,
  opts: {
    numArcs?: number
    sourceDistKm?: number
    halfAngleDeg?: number
    heightM?: number
    landRings?: LandRing[]
  } = {},
) {
  const {
    numArcs      = 4,
    sourceDistKm = 260,
    halfAngleDeg = 44,
    heightM      = 1,
    landRings,
  } = opts

  const src           = offset(lat, lon, fromDeg, sourceDistKm)
  const towardBearing = (fromDeg + 180) % 360
  const steps         = 26

  for (let i = 0; i < numArcs; i++) {
    const fraction = numArcs > 1 ? i / (numArcs - 1) : 1
    const radiusKm = sourceDistKm * (0.28 + fraction * 0.62)
    // 3× the previous weight formula
    const weight   = (8 + fraction * (14 + heightM * 2)) * 3

    const pts: [number, number][] = []
    for (let s = 0; s <= steps; s++) {
      const angle = -halfAngleDeg + (halfAngleDeg * 2 * s / steps)
      const b     = (towardBearing + angle + 360) % 360
      const p     = offset(src.lat, src.lon, b, radiusKm)
      pts.push([p.lat, p.lon])
    }

    const lineOpts: L.PolylineOptions = {
      color, weight, opacity: 1, className: `${classPrefix}-${i}`, interactive: false,
    }

    if (!landRings?.length) {
      L.polyline(pts, lineOpts).addTo(map)
    } else {
      // Split arc at land/ocean boundaries; draw only ocean segments
      const segments: [number, number][][] = []
      let cur: [number, number][] = []
      for (const pt of pts) {
        if (!pointOnLand(pt[1], pt[0], landRings)) {
          cur.push(pt)
        } else {
          if (cur.length >= 2) segments.push(cur)
          cur = []
        }
      }
      if (cur.length >= 2) segments.push(cur)
      for (const seg of segments) L.polyline(seg, lineOpts).addTo(map)
    }
  }
}

// ── Nearby spot numbered marker ────────────────────────────────────────────────
function makeNearbyIcon(rank: number, color: string): L.DivIcon {
  const html = `<div style="
    width:22px;height:22px;border-radius:50%;background:${color};
    border:2px solid rgba(255,255,255,0.85);
    display:flex;align-items:center;justify-content:center;
    font-family:system-ui,-apple-system,sans-serif;font-size:10px;font-weight:700;
    color:white;box-shadow:0 2px 6px rgba(0,0,0,0.55);cursor:pointer;
  ">${rank}</div>`
  return L.divIcon({ html, className: '', iconAnchor: [11, 11], iconSize: [22, 22] })
}

// ── Spot marker ────────────────────────────────────────────────────────────────
function makeSpotIcon(color: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:28px;height:28px;">
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0;
        animation:surfPulse 2.2s ease-out infinite;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:${color};
        border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.6);"></div>
    </div>
    <style>
      @keyframes surfPulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}
    </style>`
  return L.divIcon({ html, className: '', iconAnchor: [14, 14], iconSize: [28, 28] })
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SurfMap({ report, units, highlightLayers, nearbySpots, onSpotSelect }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null)
  const mapRef            = useRef<L.Map | null>(null)
  const nearbyMarkersRef  = useRef<L.Marker[]>([])
  const { themeId }       = useTheme()
  const { t, bcp47 }      = useLanguage()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const { lat, lon } = report.location
    const { current }  = report
    const isDark       = THEMES.find(th => th.id === themeId)?.dark ?? true
    const accentColor  = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'

    const map = L.map(containerRef.current, { center: [lat, lon], zoom: 9, zoomControl: false })
    mapRef.current = map
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer(
      isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors © <a href="https://carto.com" target="_blank">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(map)

    // Wind arcs — no land clipping needed, added immediately
    if (current.wind.speed > 2) {
      addDirectionalArcs(map, lat, lon, current.wind.direction, '#64748b', 'wind-a', {
        numArcs: 3, sourceDistKm: 110, halfAngleDeg: 24, heightM: current.wind.speed / 30,
      })
    }

    // Spot marker + popup
    const waveStr   = formatWaveHeight(current.waveHeight, units.height)
    const periodStr = current.wavePeriod > 0 ? `${current.wavePeriod.toFixed(0)}s` : '—'
    const swellDir  = t('dir.' + current.primarySwell.directionLabel)
    const swellStr  = formatWaveHeight(current.primarySwell.height, units.height) + ` · ${swellDir} · ${periodStr}`
    const windStr   = `${Math.round(current.wind.speed)} km/h ${t('dir.' + current.wind.directionLabel)}`

    const popupHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:var(--panel-bg);color:var(--text-base);
        padding:12px 14px;border-radius:10px;min-width:170px;line-height:1.5;border:1px solid var(--card-border);">
        <div style="font-size:15px;font-weight:700;color:${current.rating.color};margin-bottom:8px;">${waveStr} waves</div>
        <div style="font-size:11px;color:var(--panel-muted);margin-bottom:3px;">Primary swell</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-base);margin-bottom:8px;">${swellStr}</div>
        <div style="font-size:11px;color:var(--panel-muted);margin-bottom:3px;">Wind</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-base);">${windStr}</div>
      </div>`

    const marker = L.marker([lat, lon], { icon: makeSpotIcon(current.rating.color) })
    marker.bindPopup(popupHtml, { className: 'surf-map-popup', offset: [0, -16], closeButton: false })
    marker.addTo(map)
    setTimeout(() => marker.openPopup(), 600)

    // Swell arcs — added after land data loads (cached after first fetch)
    if (report.isCoastal) {
      getLandRings().then(landRings => {
        if (mapRef.current !== map) return  // map was torn down before fetch completed

        if (current.primarySwell.height > 0.05) {
          addDirectionalArcs(map, lat, lon, current.primarySwell.direction, accentColor, 'swell-p', {
            sourceDistKm: 270, halfAngleDeg: 52, heightM: current.primarySwell.height, landRings,
          })
        }
        if (current.secondarySwell && current.secondarySwell.height > 0.1) {
          addDirectionalArcs(map, lat, lon, current.secondarySwell.direction, '#94a3b8', 'swell-s', {
            sourceDistKm: 220, halfAngleDeg: 40, heightM: current.secondarySwell.height, landRings,
          })
        }
      })
    }

    return () => {
      nearbyMarkersRef.current.forEach(m => m.remove())
      nearbyMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [themeId, bcp47, report.location.lat, report.location.lon]) // eslint-disable-line react-hooks/exhaustive-deps

  // Nearby spot markers — separate effect so they don't force a full map rebuild
  useEffect(() => {
    const map = mapRef.current
    nearbyMarkersRef.current.forEach(m => m.remove())
    nearbyMarkersRef.current = []
    if (!map || !nearbySpots?.length) return

    nearbySpots.forEach((spot, idx) => {
      const waveStr = formatWaveHeight(spot.waveHeight, units.height)
      const marker = L.marker([spot.lat, spot.lon], {
        icon: makeNearbyIcon(idx + 1, spot.rating.color),
        zIndexOffset: -100,
      })
      marker.bindTooltip(
        `<div style="font-family:system-ui,-apple-system,sans-serif;background:var(--panel-bg);` +
        `color:var(--text-base);padding:8px 11px;border-radius:8px;border:1px solid var(--card-border);` +
        `box-shadow:0 6px 20px rgba(0,0,0,0.45);min-width:130px;">` +
        `<div style="font-size:12px;font-weight:600;color:var(--text-base);margin-bottom:3px;">${spot.name}</div>` +
        `<div style="font-size:13px;font-weight:700;color:${spot.rating.color};">${waveStr}</div>` +
        `</div>`,
        { direction: 'top', offset: [0, -14], className: 'surf-nearby-tip' },
      )
      if (onSpotSelect) {
        marker.on('click', () => onSpotSelect(spot))
      }
      marker.addTo(map)
      nearbyMarkersRef.current.push(marker)
    })

    return () => {
      nearbyMarkersRef.current.forEach(m => m.remove())
      nearbyMarkersRef.current = []
    }
  }, [nearbySpots, onSpotSelect, themeId, bcp47]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update dim attributes without rebuilding the map
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const hasSome = !!highlightLayers && highlightLayers.size > 0
    el.toggleAttribute('data-dim-primary',   hasSome && !highlightLayers!.has('primary'))
    el.toggleAttribute('data-dim-secondary', hasSome && !highlightLayers!.has('secondary'))
    el.toggleAttribute('data-dim-wind',      hasSome && !highlightLayers!.has('wind'))
  }, [highlightLayers])

  return (
    <>
      <style>{`
        /* ── Per-arc: heavy blur far from shore, lighter near ───────────── */
        .swell-p-0 { --arc-peak:0.18; filter:blur(22px); }
        .swell-p-1 { --arc-peak:0.22; filter:blur(16px); }
        .swell-p-2 { --arc-peak:0.26; filter:blur(10px); }
        .swell-p-3 { --arc-peak:0.30; filter:blur(6px);  }

        .swell-s-0 { --arc-peak:0.12; filter:blur(26px); }
        .swell-s-1 { --arc-peak:0.15; filter:blur(19px); }
        .swell-s-2 { --arc-peak:0.18; filter:blur(12px); }
        .swell-s-3 { --arc-peak:0.21; filter:blur(7px);  }

        .wind-a-0  { --arc-peak:0.08; filter:blur(14px); }
        .wind-a-1  { --arc-peak:0.10; filter:blur(10px); }
        .wind-a-2  { --arc-peak:0.12; filter:blur(6px);  }

        /* Quick rise, slower fade — clear wave-train direction */
        @keyframes arc-pulse {
          0%   { opacity: 0; }
          25%  { opacity: var(--arc-peak, 0.3); }
          55%  { opacity: 0; }
          100% { opacity: 0; }
        }

        /* Primary swell — 3.5 s period, 0.875 s delay (4 arcs fill one cycle) */
        .swell-p-0 { animation: arc-pulse 3.5s ease-in-out 0.000s infinite backwards; }
        .swell-p-1 { animation: arc-pulse 3.5s ease-in-out 0.875s infinite backwards; }
        .swell-p-2 { animation: arc-pulse 3.5s ease-in-out 1.750s infinite backwards; }
        .swell-p-3 { animation: arc-pulse 3.5s ease-in-out 2.625s infinite backwards; }

        /* Secondary swell — 5.0 s, 1.25 s delay */
        .swell-s-0 { animation: arc-pulse 5.0s ease-in-out 0.000s infinite backwards; }
        .swell-s-1 { animation: arc-pulse 5.0s ease-in-out 1.250s infinite backwards; }
        .swell-s-2 { animation: arc-pulse 5.0s ease-in-out 2.500s infinite backwards; }
        .swell-s-3 { animation: arc-pulse 5.0s ease-in-out 3.750s infinite backwards; }

        /* Wind — 7.0 s, 2.33 s delay (3 arcs fill one cycle) */
        .wind-a-0 { animation: arc-pulse 7.0s ease-in-out 0.000s infinite backwards; }
        .wind-a-1 { animation: arc-pulse 7.0s ease-in-out 2.333s infinite backwards; }
        .wind-a-2 { animation: arc-pulse 7.0s ease-in-out 4.666s infinite backwards; }

        /* ── Legend multi-select: each layer dims independently ──────────── */
        .surf-map-container[data-dim-primary] .swell-p-0,
        .surf-map-container[data-dim-primary] .swell-p-1,
        .surf-map-container[data-dim-primary] .swell-p-2,
        .surf-map-container[data-dim-primary] .swell-p-3 {
          animation: none !important; opacity: 0.05 !important;
        }
        .surf-map-container[data-dim-secondary] .swell-s-0,
        .surf-map-container[data-dim-secondary] .swell-s-1,
        .surf-map-container[data-dim-secondary] .swell-s-2,
        .surf-map-container[data-dim-secondary] .swell-s-3 {
          animation: none !important; opacity: 0.05 !important;
        }
        .surf-map-container[data-dim-wind] .wind-a-0,
        .surf-map-container[data-dim-wind] .wind-a-1,
        .surf-map-container[data-dim-wind] .wind-a-2 {
          animation: none !important; opacity: 0.05 !important;
        }

        /* ── Nearby spot tooltips ────────────────────────────────────────── */
        .surf-nearby-tip {
          background: transparent !important; border: none !important;
          box-shadow: none !important; padding: 0 !important;
        }
        .surf-nearby-tip::before { display: none !important; }

        /* ── Popup ────────────────────────────────────────────────────────── */
        .surf-map-popup .leaflet-popup-content-wrapper {
          background:transparent!important; box-shadow:0 8px 32px rgba(0,0,0,0.4)!important;
          border-radius:10px!important; padding:0!important; border:none!important;
        }
        .surf-map-popup .leaflet-popup-content { margin:0!important; }
        .surf-map-popup .leaflet-popup-tip-container { display:none; }

        /* ── Leaflet controls ─────────────────────────────────────────────── */
        .leaflet-control-zoom a {
          background:var(--panel-bg)!important; color:var(--panel-label)!important;
          border-color:var(--card-border)!important;
        }
        .leaflet-control-zoom a:hover {
          background:var(--panel-hover)!important; color:var(--text-base)!important;
        }
        .leaflet-control-attribution {
          background:var(--panel-bg)!important; color:var(--panel-muted)!important; font-size:9px!important;
        }
        .leaflet-control-attribution a { color:var(--panel-label)!important; }
      `}</style>
      <div ref={containerRef} className="surf-map-container w-full h-full" style={{ background: 'var(--bg-start)' }} />
    </>
  )
}

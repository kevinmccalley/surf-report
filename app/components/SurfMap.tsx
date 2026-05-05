'use client'

// Leaflet CSS — loaded client-only via dynamic import with ssr:false in MapPanel
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { SurfReport } from '@/app/lib/types'
import { formatWaveHeight, getDirectionLabel } from '@/app/lib/utils'
import { useTheme } from '@/app/components/ThemeProvider'
import { THEMES } from '@/app/lib/themes'

interface Props {
  report: SurfReport
  units: { height: 'ft' | 'm' }
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

// ── Swell beam — directional arrow from source to spot ─────────────────────────
// A long dashed arrow drawn FROM the swell's origin direction TOWARD the surf
// spot. The CSS-animated dashOffset makes the dashes march toward shore,
// making the arrival direction immediately obvious.
function addSwellBeam(
  map: L.Map,
  lat: number,
  lon: number,
  fromDeg: number,
  color: string,
  baseOpacity: number,
  cssClass: string,
) {
  const source = offset(lat, lon, fromDeg, 250)   // 250 km offshore in FROM direction
  const near   = offset(lat, lon, fromDeg, 18)    // stop 18 km short of the pin

  // Animated dashed shaft — flows from source toward shore
  L.polyline([[source.lat, source.lon], [near.lat, near.lon]], {
    color,
    weight: 1,
    opacity: baseOpacity * 0.4,
    dashArray: '10 6',
    className: cssClass,
    interactive: false,
  }).addTo(map)

  // Solid arrowhead at the near-shore end, pointing toward the spot
  const left  = offset(near.lat, near.lon, (fromDeg + 155) % 360, 20)
  const right = offset(near.lat, near.lon, (fromDeg + 205) % 360, 20)
  L.polyline([[left.lat, left.lon], [near.lat, near.lon], [right.lat, right.lon]], {
    color,
    weight: 1.8,
    opacity: baseOpacity * 0.65,
    interactive: false,
  }).addTo(map)
}

// ── Swell wave-front lines ─────────────────────────────────────────────────────
// Parallel lines perpendicular to travel direction, spaced evenly offshore.
// All use the same dashArray so the CSS animation runs uniformly.
function addSwellLines(
  map: L.Map,
  lat: number,
  lon: number,
  fromDeg: number,
  heightM: number,
  color: string,
  baseOpacity: number,
  cssClass: string,
) {
  const numLines  = 4
  const spacingKm = 55
  const halfLenKm = 85
  const perpDeg   = (fromDeg + 90) % 360

  for (let i = numLines; i >= 1; i--) {
    const distKm   = i * spacingKm
    const fraction = (numLines - i + 1) / numLines   // 0.25 → 1.0 near shore
    const opacity  = baseOpacity * (0.2 + fraction * 0.65)
    const weight   = 0.8 + fraction * (0.6 + heightM * 0.3)

    const center = offset(lat, lon, fromDeg, distKm)
    const p1 = offset(center.lat, center.lon, perpDeg, halfLenKm)
    const p2 = offset(center.lat, center.lon, (perpDeg + 180) % 360, halfLenKm)

    L.polyline([[p1.lat, p1.lon], [center.lat, center.lon], [p2.lat, p2.lon]], {
      color,
      weight,
      opacity,
      dashArray: '10 6',
      className: cssClass,
      interactive: false,
    }).addTo(map)
  }
}

// ── Wind direction needle ──────────────────────────────────────────────────────
// Animated dashed shaft + solid arrowhead pointing FROM wind origin direction.
function addWindArrow(map: L.Map, lat: number, lon: number, windDeg: number, speedKmh: number) {
  const len  = 18 + Math.min(speedKmh * 0.25, 20)
  const tip  = offset(lat, lon, windDeg, len)
  const base = offset(lat, lon, (windDeg + 180) % 360, len * 0.5)

  // Animated dashed shaft
  L.polyline([[base.lat, base.lon], [tip.lat, tip.lon]], {
    color: '#64748b',
    weight: 1.5,
    opacity: 0.5,
    dashArray: '6 5',
    className: 'wind-shaft',
    interactive: false,
  }).addTo(map)

  // Solid arrowhead at tip
  const left  = offset(tip.lat, tip.lon, (windDeg + 150) % 360, len * 0.22)
  const right = offset(tip.lat, tip.lon, (windDeg + 210) % 360, len * 0.22)
  L.polyline([[left.lat, left.lon], [tip.lat, tip.lon], [right.lat, right.lon]], {
    color: '#64748b',
    weight: 1.5,
    opacity: 0.55,
    interactive: false,
  }).addTo(map)
}

// ── Spot marker ────────────────────────────────────────────────────────────────
function makeSpotIcon(color: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:28px;height:28px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        border:2px solid ${color};opacity:0;
        animation:surfPulse 2.2s ease-out infinite;
      "></div>
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${color};border:3px solid white;
        box-shadow:0 2px 12px rgba(0,0,0,0.6);
      "></div>
    </div>
    <style>
      @keyframes surfPulse {
        0%  { transform:scale(1);   opacity:0.7; }
        70% { transform:scale(2.4); opacity:0;   }
        100%{ transform:scale(2.4); opacity:0;   }
      }
    </style>
  `
  return L.divIcon({ html, className: '', iconAnchor: [14, 14], iconSize: [28, 28] })
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SurfMap({ report, units }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const { themeId }  = useTheme()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const { lat, lon } = report.location
    const { current }  = report

    const isDark     = THEMES.find(t => t.id === themeId)?.dark ?? true
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 9,
      zoomControl: false,
    })
    mapRef.current = map

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors ' +
        '© <a href="https://carto.com" target="_blank">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Primary swell — beam shows direction, fronts show breadth
    if (report.isCoastal && current.primarySwell.height > 0.05) {
      addSwellBeam(map, lat, lon, current.primarySwell.direction, accentColor, 1.0, 'swell-beam-primary')
      addSwellLines(map, lat, lon, current.primarySwell.direction, current.primarySwell.height, accentColor, 1.0, 'swell-front-primary')
    }

    // Secondary swell (wind wave)
    if (report.isCoastal && current.secondarySwell && current.secondarySwell.height > 0.1) {
      addSwellBeam(map, lat, lon, current.secondarySwell.direction, '#94a3b8', 0.55, 'swell-beam-secondary')
      addSwellLines(map, lat, lon, current.secondarySwell.direction, current.secondarySwell.height, '#94a3b8', 0.55, 'swell-front-secondary')
    }

    // Wind
    if (current.wind.speed > 2) {
      addWindArrow(map, lat, lon, current.wind.direction, current.wind.speed)
    }

    // Spot marker + popup
    const waveStr      = formatWaveHeight(current.waveHeight, units.height)
    const periodStr    = current.wavePeriod > 0 ? `${current.wavePeriod.toFixed(0)}s` : '—'
    const swellDirLabel = getDirectionLabel(current.primarySwell.direction)
    const swellFromStr = formatWaveHeight(current.primarySwell.height, units.height) + ` · ${swellDirLabel} · ${periodStr}`
    const windStr      = `${Math.round(current.wind.speed)} km/h ${getDirectionLabel(current.wind.direction)}`

    const popupHtml = `
      <div style="
        font-family:system-ui,-apple-system,sans-serif;
        background:var(--panel-bg);color:var(--text-base);
        padding:12px 14px;border-radius:10px;
        min-width:170px;line-height:1.5;
        border:1px solid var(--card-border);
      ">
        <div style="font-size:15px;font-weight:700;color:${current.rating.color};margin-bottom:8px;">
          ${waveStr} waves
        </div>
        <div style="font-size:11px;color:var(--panel-muted);margin-bottom:3px;">Primary swell</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-base);margin-bottom:8px;">${swellFromStr}</div>
        <div style="font-size:11px;color:var(--panel-muted);margin-bottom:3px;">Wind</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-base);">${windStr}</div>
      </div>
    `

    const marker = L.marker([lat, lon], { icon: makeSpotIcon(current.rating.color) })
    marker.bindPopup(popupHtml, {
      className: 'surf-map-popup',
      offset: [0, -16],
      closeButton: false,
    })
    marker.addTo(map)
    setTimeout(() => marker.openPopup(), 600)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [themeId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        /* ── Directional flow animations ───────────────────────────────────── */
        /* dashArray total = 16 (10+6); offset goes 0→-16 = one seamless cycle  */
        @keyframes swell-march { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -16; } }
        @keyframes wind-march  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -11; } }

        /* Beam: fast march toward shore — makes arrival direction obvious */
        .swell-beam-primary   { animation: swell-march 1.1s linear infinite; }
        .swell-beam-secondary { animation: swell-march 1.6s linear infinite; }

        /* Fronts: slightly slower — suggests wave period rhythm */
        .swell-front-primary   { animation: swell-march 1.7s linear infinite; }
        .swell-front-secondary { animation: swell-march 2.4s linear infinite; }

        /* Wind: slow, subtle — less prominent than swell */
        .wind-shaft { animation: wind-march 2.8s linear infinite; }

        /* ── Popup ─────────────────────────────────────────────────────────── */
        .surf-map-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
          border-radius: 10px !important;
          padding: 0 !important;
          border: none !important;
        }
        .surf-map-popup .leaflet-popup-content { margin: 0 !important; }
        .surf-map-popup .leaflet-popup-tip-container { display: none; }

        /* ── Leaflet controls ──────────────────────────────────────────────── */
        .leaflet-control-zoom a {
          background: var(--panel-bg) !important;
          color: var(--panel-label) !important;
          border-color: var(--card-border) !important;
        }
        .leaflet-control-zoom a:hover {
          background: var(--panel-hover) !important;
          color: var(--text-base) !important;
        }
        .leaflet-control-attribution {
          background: var(--panel-bg) !important;
          color: var(--panel-muted) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: var(--panel-label) !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" style={{ background: 'var(--bg-start)' }} />
    </>
  )
}

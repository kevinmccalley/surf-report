'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { SurfReport } from '@/app/lib/types'
import { formatWaveHeight } from '@/app/lib/utils'
import { useTheme } from '@/app/components/ThemeProvider'
import { THEMES } from '@/app/lib/themes'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  report: SurfReport
  units: { height: 'ft' | 'm' }
  highlightLayer?: string | null
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

// ── Directional arc pulses ─────────────────────────────────────────────────────
// Places a virtual swell source far offshore in the FROM direction. Draws
// numArcs concentric partial-circle arcs centred on that source. Each arc has a
// CSS class (classPrefix-0…3) that the <style> block animates with staggered
// delays — farthest arc pulses first, nearest last — creating a wave-train
// marching toward shore. Weight increases near-shore for depth-of-field feel.
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
  } = {},
) {
  const {
    numArcs     = 4,
    sourceDistKm = 260,
    halfAngleDeg = 44,
    heightM     = 1,
  } = opts

  // Virtual source point — centre of all concentric arcs
  const src           = offset(lat, lon, fromDeg, sourceDistKm)
  const towardBearing = (fromDeg + 180) % 360
  const steps         = 26

  for (let i = 0; i < numArcs; i++) {
    const fraction = numArcs > 1 ? i / (numArcs - 1) : 1   // 0=far → 1=near shore
    const radiusKm = sourceDistKm * (0.28 + fraction * 0.62) // 28%→90% of source dist
    const weight   = 0.6 + fraction * (1.1 + heightM * 0.25)

    const pts: [number, number][] = []
    for (let s = 0; s <= steps; s++) {
      const angle = -halfAngleDeg + (halfAngleDeg * 2 * s / steps)
      const b     = (towardBearing + angle + 360) % 360
      const p     = offset(src.lat, src.lon, b, radiusKm)
      pts.push([p.lat, p.lon])
    }

    L.polyline(pts, {
      color,
      weight,
      opacity: 1,          // CSS animation owns opacity
      className: `${classPrefix}-${i}`,
      interactive: false,
    }).addTo(map)
  }
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
export default function SurfMap({ report, units, highlightLayer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const { themeId }  = useTheme()
  const { t, bcp47 } = useLanguage()

  // Rebuild map when theme or locale changes
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

    // Primary swell — accent colour, full presence
    if (report.isCoastal && current.primarySwell.height > 0.05) {
      addDirectionalArcs(map, lat, lon, current.primarySwell.direction, accentColor, 'swell-p', {
        sourceDistKm: 270, halfAngleDeg: 46, heightM: current.primarySwell.height,
      })
    }

    // Secondary swell — muted slate, slower pulse
    if (report.isCoastal && current.secondarySwell && current.secondarySwell.height > 0.1) {
      addDirectionalArcs(map, lat, lon, current.secondarySwell.direction, '#94a3b8', 'swell-s', {
        sourceDistKm: 220, halfAngleDeg: 40, heightM: current.secondarySwell.height,
      })
    }

    // Wind — narrow arcs (wind is directional), slow & soft
    if (current.wind.speed > 2) {
      addDirectionalArcs(map, lat, lon, current.wind.direction, '#64748b', 'wind-a', {
        numArcs: 3, sourceDistKm: 110, halfAngleDeg: 24, heightM: current.wind.speed / 30,
      })
    }

    // Spot marker + popup
    const waveStr     = formatWaveHeight(current.waveHeight, units.height)
    const periodStr   = current.wavePeriod > 0 ? `${current.wavePeriod.toFixed(0)}s` : '—'
    const swellDir    = t('dir.' + current.primarySwell.directionLabel)
    const swellStr    = formatWaveHeight(current.primarySwell.height, units.height) + ` · ${swellDir} · ${periodStr}`
    const windStr     = `${Math.round(current.wind.speed)} km/h ${t('dir.' + current.wind.directionLabel)}`

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

    return () => { map.remove(); mapRef.current = null }
  }, [themeId, bcp47]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update highlight attribute without rebuilding the map
  useEffect(() => {
    if (!containerRef.current) return
    if (highlightLayer) {
      containerRef.current.setAttribute('data-highlight', highlightLayer)
    } else {
      containerRef.current.removeAttribute('data-highlight')
    }
  }, [highlightLayer])

  return (
    <>
      <style>{`
        /* ── Per-layer peak opacity ───────────────────────────────────────── */
        .swell-p-0,.swell-p-1,.swell-p-2,.swell-p-3 { --arc-peak: 0.88; }
        .swell-s-0,.swell-s-1,.swell-s-2,.swell-s-3 { --arc-peak: 0.62; }
        .wind-a-0,.wind-a-1,.wind-a-2,.wind-a-3     { --arc-peak: 0.40; }

        /* Single keyframe — peak resolves per-element via CSS var */
        @keyframes arc-pulse {
          0%,100% { opacity: 0; }
          20%,55% { opacity: var(--arc-peak, 0.7); }
        }

        /* Primary swell — 2.2 s period, delay steps 0.55 s */
        .swell-p-0 { animation: arc-pulse 2.2s ease-in-out 0.00s infinite backwards; }
        .swell-p-1 { animation: arc-pulse 2.2s ease-in-out 0.55s infinite backwards; }
        .swell-p-2 { animation: arc-pulse 2.2s ease-in-out 1.10s infinite backwards; }
        .swell-p-3 { animation: arc-pulse 2.2s ease-in-out 1.65s infinite backwards; }

        /* Secondary swell — 3.0 s, delay 0.75 s */
        .swell-s-0 { animation: arc-pulse 3.0s ease-in-out 0.00s infinite backwards; }
        .swell-s-1 { animation: arc-pulse 3.0s ease-in-out 0.75s infinite backwards; }
        .swell-s-2 { animation: arc-pulse 3.0s ease-in-out 1.50s infinite backwards; }
        .swell-s-3 { animation: arc-pulse 3.0s ease-in-out 2.25s infinite backwards; }

        /* Wind — 4.0 s, delay 1.33 s (3 arcs) */
        .wind-a-0 { animation: arc-pulse 4.0s ease-in-out 0.00s infinite backwards; }
        .wind-a-1 { animation: arc-pulse 4.0s ease-in-out 1.33s infinite backwards; }
        .wind-a-2 { animation: arc-pulse 4.0s ease-in-out 2.66s infinite backwards; }

        /* ── Legend-click highlight: dim the inactive layers ─────────────── */
        .surf-map-container[data-highlight="primary"]
          .swell-s-0,.surf-map-container[data-highlight="primary"] .swell-s-1,
          .surf-map-container[data-highlight="primary"] .swell-s-2,
          .surf-map-container[data-highlight="primary"] .swell-s-3,
          .surf-map-container[data-highlight="primary"] .wind-a-0,
          .surf-map-container[data-highlight="primary"] .wind-a-1,
          .surf-map-container[data-highlight="primary"] .wind-a-2 {
          animation: none !important; opacity: 0.05 !important;
        }
        .surf-map-container[data-highlight="secondary"]
          .swell-p-0,.surf-map-container[data-highlight="secondary"] .swell-p-1,
          .surf-map-container[data-highlight="secondary"] .swell-p-2,
          .surf-map-container[data-highlight="secondary"] .swell-p-3,
          .surf-map-container[data-highlight="secondary"] .wind-a-0,
          .surf-map-container[data-highlight="secondary"] .wind-a-1,
          .surf-map-container[data-highlight="secondary"] .wind-a-2 {
          animation: none !important; opacity: 0.05 !important;
        }
        .surf-map-container[data-highlight="wind"]
          .swell-p-0,.surf-map-container[data-highlight="wind"] .swell-p-1,
          .surf-map-container[data-highlight="wind"] .swell-p-2,
          .surf-map-container[data-highlight="wind"] .swell-p-3,
          .surf-map-container[data-highlight="wind"] .swell-s-0,
          .surf-map-container[data-highlight="wind"] .swell-s-1,
          .surf-map-container[data-highlight="wind"] .swell-s-2,
          .surf-map-container[data-highlight="wind"] .swell-s-3 {
          animation: none !important; opacity: 0.05 !important;
        }

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

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
  highlightLayers?: Set<string>
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

  const src           = offset(lat, lon, fromDeg, sourceDistKm)
  const towardBearing = (fromDeg + 180) % 360
  const steps         = 26

  for (let i = 0; i < numArcs; i++) {
    const fraction = numArcs > 1 ? i / (numArcs - 1) : 1   // 0=far → 1=near shore
    const radiusKm = sourceDistKm * (0.28 + fraction * 0.62)
    const weight   = 8 + fraction * (14 + heightM * 2)     // thick soft glow, heavier near shore

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
export default function SurfMap({ report, units, highlightLayers }: Props) {
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
        sourceDistKm: 270, halfAngleDeg: 52, heightM: current.primarySwell.height,
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
        /* ── Per-arc: blur heavier far from shore, lighter near ─────────── */
        .swell-p-0 { --arc-peak:0.35; filter:blur(12px); }
        .swell-p-1 { --arc-peak:0.40; filter:blur(9px);  }
        .swell-p-2 { --arc-peak:0.44; filter:blur(6px);  }
        .swell-p-3 { --arc-peak:0.48; filter:blur(4px);  }

        .swell-s-0 { --arc-peak:0.22; filter:blur(14px); }
        .swell-s-1 { --arc-peak:0.25; filter:blur(11px); }
        .swell-s-2 { --arc-peak:0.28; filter:blur(8px);  }
        .swell-s-3 { --arc-peak:0.31; filter:blur(6px);  }

        .wind-a-0  { --arc-peak:0.12; filter:blur(10px); }
        .wind-a-1  { --arc-peak:0.15; filter:blur(7px);  }
        .wind-a-2  { --arc-peak:0.18; filter:blur(5px);  }

        /* Smooth rise-hold-fall; peak opacity resolves per-element via CSS var */
        @keyframes arc-pulse {
          0%   { opacity: 0; }
          35%  { opacity: var(--arc-peak, 0.4); }
          65%  { opacity: var(--arc-peak, 0.4); }
          100% { opacity: 0; }
        }

        /* Primary swell — 3.2 s period, delay 0.8 s */
        .swell-p-0 { animation: arc-pulse 3.2s ease-in-out 0.00s infinite backwards; }
        .swell-p-1 { animation: arc-pulse 3.2s ease-in-out 0.80s infinite backwards; }
        .swell-p-2 { animation: arc-pulse 3.2s ease-in-out 1.60s infinite backwards; }
        .swell-p-3 { animation: arc-pulse 3.2s ease-in-out 2.40s infinite backwards; }

        /* Secondary swell — 4.5 s, delay 1.1 s */
        .swell-s-0 { animation: arc-pulse 4.5s ease-in-out 0.00s infinite backwards; }
        .swell-s-1 { animation: arc-pulse 4.5s ease-in-out 1.10s infinite backwards; }
        .swell-s-2 { animation: arc-pulse 4.5s ease-in-out 2.20s infinite backwards; }
        .swell-s-3 { animation: arc-pulse 4.5s ease-in-out 3.30s infinite backwards; }

        /* Wind — 6.0 s, delay 2.0 s (3 arcs) */
        .wind-a-0 { animation: arc-pulse 6.0s ease-in-out 0.00s infinite backwards; }
        .wind-a-1 { animation: arc-pulse 6.0s ease-in-out 2.00s infinite backwards; }
        .wind-a-2 { animation: arc-pulse 6.0s ease-in-out 4.00s infinite backwards; }

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

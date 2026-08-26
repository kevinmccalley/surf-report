'use client'

import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import L from 'leaflet'
import '@maplibre/maplibre-gl-leaflet'
import { useEffect, useRef } from 'react'
import { useTheme } from '@/app/components/ThemeProvider'
import { THEMES } from '@/app/lib/themes'
import { mapStyle } from '@/app/lib/map-style'
import { registerPmtilesProtocol } from '@/app/lib/pmtiles-protocol'
import { regionFitTarget, pointsKey, type RegionMapPoint } from '@/app/lib/region-map'

interface Props {
  /** Spots to plot, in list order — the marker badge shows the 1-based index. */
  points: RegionMapPoint[]
  /** Optional curated bbox override (a region's `bounds`). */
  bounds?: [[number, number], [number, number]] | null
  /** Slug of the spot to emphasise — keeps the map in sync with a list hover/selection. */
  activeSlug?: string | null
  /** Marker click. */
  onSelect?: (slug: string) => void
  /** Marker hover in / out (null on out) — for two-way list ↔ map highlighting. */
  onHover?: (slug: string | null) => void
  /** Padding in px applied when fitting bounds. */
  fitPadding?: number
  className?: string
}

function isDarkTheme(themeId: string): boolean {
  return THEMES.find(t => t.id === themeId)?.dark ?? true
}

function accentColor(): string {
  if (typeof document === 'undefined') return '#22d3ee'
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'
}

function makeMarkerIcon(index: number, color: string, active: boolean): L.DivIcon {
  const size = active ? 32 : 24
  const ring = active
    ? `<span style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:0.55;"></span>`
    : ''
  const html =
    `<span style="position:relative;display:block;width:${size}px;height:${size}px;">` +
    ring +
    `<span style="position:absolute;inset:0;border-radius:50%;background:${color};` +
    `border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.55);` +
    `display:flex;align-items:center;justify-content:center;` +
    `font:700 ${active ? 13 : 11}px system-ui,-apple-system,sans-serif;color:#fff;">${index + 1}</span>` +
    `</span>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

export default function RegionMap({
  points,
  bounds,
  activeSlug,
  onSelect,
  onHover,
  fitPadding = 48,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseRef = useRef<L.Layer | null>(null)
  const markersRef = useRef<Map<string, { marker: L.Marker; index: number }>>(new Map())
  const colorRef = useRef<string>('#22d3ee')
  const fittedKeyRef = useRef<string>('')
  // Latest camera-fit closure — re-run after the container settles to its real size.
  const fitRef = useRef<() => void>(() => {})

  const { themeId } = useTheme()

  // Keep callbacks fresh without re-binding every marker.
  const onSelectRef = useRef(onSelect)
  const onHoverRef = useRef(onHover)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onHoverRef.current = onHover }, [onHover])

  // ── Create the map once. Never torn down until unmount. ──────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    registerPmtilesProtocol()

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      scrollWheelZoom: false, // opt-in on focus/click, so the page still scrolls over the map
    })
    mapRef.current = map
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

    baseRef.current = L.maplibreGL({ style: mapStyle(isDarkTheme(themeId)) }).addTo(map)

    // A full-bleed / flex container only reaches its real size after layout — and
    // the MapLibre GL canvas won't paint (or the camera fit is computed against the
    // wrong size) until it's nudged. Resize the Leaflet map *and* the GL map, then
    // re-run the latest camera fit.
    const settle = () => {
      if (!mapRef.current) return
      map.invalidateSize()
      const glLayer = baseRef.current as unknown as { getMaplibreMap?: () => { resize: () => void; triggerRepaint: () => void } }
      const gl = glLayer?.getMaplibreMap?.()
      if (gl) {
        gl.resize()
        gl.triggerRepaint()
      }
      fitRef.current()
    }
    const ro = new ResizeObserver(settle)
    ro.observe(containerRef.current)
    requestAnimationFrame(settle)
    const t = setTimeout(settle, 250)

    return () => {
      clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      baseRef.current = null
      markersRef.current.clear()
      fittedKeyRef.current = ''
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap the basemap style on theme change — no map remount. ─────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (baseRef.current) baseRef.current.remove()
    baseRef.current = L.maplibreGL({ style: mapStyle(isDarkTheme(themeId)) }).addTo(map)
    colorRef.current = accentColor()
    // Recolour existing markers to the new theme accent.
    for (const [slug, { marker, index }] of markersRef.current) {
      marker.setIcon(makeMarkerIcon(index, colorRef.current, slug === activeSlug))
    }
  }, [themeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rebuild markers + fit camera when the point set changes. ─────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    colorRef.current = accentColor()
    for (const { marker } of markersRef.current.values()) marker.remove()
    markersRef.current.clear()

    points.forEach((p, index) => {
      const marker = L.marker([p.lat, p.lon], {
        icon: makeMarkerIcon(index, colorRef.current, p.slug === activeSlug),
        title: p.name,
        alt: p.name,
        riseOnHover: true,
        keyboard: true,
      })
      marker.bindTooltip(p.name, { direction: 'top', offset: [0, -12], className: 'region-map-tip' })
      marker.on('click', () => onSelectRef.current?.(p.slug))
      marker.on('mouseover', () => onHoverRef.current?.(p.slug))
      marker.on('mouseout', () => onHoverRef.current?.(null))
      marker.addTo(map)
      markersRef.current.set(p.slug, { marker, index })
    })

    // Keep the fit as a closure so `settle` (on container resize) can re-apply it.
    fitRef.current = () => {
      const m = mapRef.current
      if (!m) return
      const target = regionFitTarget(points, bounds)
      if (target.kind === 'empty') {
        m.setView([20, 0], 2, { animate: false })
      } else if (target.kind === 'point') {
        m.setView([target.lat, target.lon], target.zoom, { animate: false })
      } else {
        m.fitBounds(L.latLngBounds(target.bounds[0], target.bounds[1]), {
          padding: [fitPadding, fitPadding],
          maxZoom: 12,
          animate: false,
        })
      }
    }

    const key = pointsKey(points) + '::' + (bounds ? JSON.stringify(bounds) : '')
    if (key === fittedKeyRef.current) return
    fittedKeyRef.current = key
    fitRef.current()
  }, [pointsKey(points), bounds, fitPadding]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Move the emphasis without re-fitting or rebuilding. ──────────────────
  useEffect(() => {
    for (const [slug, { marker, index }] of markersRef.current) {
      const active = slug === activeSlug
      marker.setIcon(makeMarkerIcon(index, colorRef.current, active))
      marker.setZIndexOffset(active ? 1000 : 0)
    }
  }, [activeSlug])

  return (
    <>
      <style>{`
        .region-map-container { width: 100%; height: 100%; }
        .region-map-container .leaflet-container { background: var(--bg-start, #0b1220); font: inherit; }

        .region-map-tip {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--text-base, #e2e8f0) !important;
          border: 1px solid var(--card-border, rgba(255,255,255,0.1)) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45) !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 5px 9px !important;
        }
        .region-map-tip::before { display: none !important; }

        .region-map-container .leaflet-control-zoom a {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--panel-label, #94a3b8) !important;
          border-color: var(--card-border, rgba(255,255,255,0.1)) !important;
        }
        .region-map-container .leaflet-control-zoom a:hover {
          background: var(--panel-hover, #1e293b) !important;
          color: var(--text-base, #e2e8f0) !important;
        }
        .region-map-container .leaflet-control-attribution {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--panel-muted, #64748b) !important;
          font-size: 9px !important;
        }
        .region-map-container .leaflet-control-attribution a { color: var(--panel-label, #94a3b8) !important; }

        @media (prefers-reduced-motion: reduce) {
          .region-map-container .leaflet-marker-icon { transition: none !important; }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`region-map-container${className ? ' ' + className : ''}`}
        style={{ background: 'var(--bg-start)' }}
      />
    </>
  )
}

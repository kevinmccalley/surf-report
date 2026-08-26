'use client'

import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import L from 'leaflet'
import '@maplibre/maplibre-gl-leaflet'
import { useEffect, useRef } from 'react'
import { useTheme } from '@/app/components/ThemeProvider'
import { THEMES } from '@/app/lib/themes'
import { mapStyle } from '@/app/lib/map-style'
import type { RegionShape, WorldSpot } from '@/app/lib/region-hull'

interface Props {
  /** Every region's hover shape — a polygon, or a point for a 1–2 break region. */
  shapes: RegionShape[]
  /** Every plotted break — the pin layer revealed once you zoom in. */
  spots: WorldSpot[]
  /** Region highlighted / cleared as the pointer moves (for an external label). */
  onHoverRegion?: (slug: string | null) => void
  onSelectRegion?: (slug: string) => void
  onSelectSpot?: (slug: string) => void
  /** Zoom at/above which break pins replace the region blobs. */
  revealZoom?: number
}

function isDarkTheme(themeId: string): boolean {
  return THEMES.find(t => t.id === themeId)?.dark ?? true
}

function accentColor(): string {
  if (typeof document === 'undefined') return '#22d3ee'
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'
}

export default function WorldRegionsMap({
  shapes,
  spots,
  onHoverRegion,
  onSelectRegion,
  onSelectSpot,
  revealZoom = 5,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseRef = useRef<L.Layer | null>(null)
  const regionLayerRef = useRef<L.LayerGroup | null>(null)
  const spotLayerRef = useRef<L.LayerGroup | null>(null)
  const regionPathsRef = useRef<Map<string, L.Path>>(new Map())
  const colorRef = useRef('#22d3ee')
  const zoomedInRef = useRef(false)
  // Latest closures — re-run after the container settles to its real size.
  const fitRef = useRef<() => void>(() => {})
  const applyZoomRef = useRef<() => void>(() => {})

  const { themeId } = useTheme()

  const onHoverRef = useRef(onHoverRegion)
  const onSelectRegionRef = useRef(onSelectRegion)
  const onSelectSpotRef = useRef(onSelectSpot)
  useEffect(() => { onHoverRef.current = onHoverRegion }, [onHoverRegion])
  useEffect(() => { onSelectRegionRef.current = onSelectRegion }, [onSelectRegion])
  useEffect(() => { onSelectSpotRef.current = onSelectSpot }, [onSelectSpot])

  // ── Create the map once. Never torn down until unmount. ─────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [18, 0],
      zoom: 2,
      minZoom: 2,
      zoomControl: false,
      scrollWheelZoom: false, // opt-in on focus, so the page still scrolls over the map
      worldCopyJump: true,
    })
    mapRef.current = map
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

    baseRef.current = L.maplibreGL({ style: mapStyle(isDarkTheme(themeId)) }).addTo(map)

    regionLayerRef.current = L.layerGroup().addTo(map)
    spotLayerRef.current = L.layerGroup()

    map.on('zoomend', () => applyZoomRef.current())

    // A full-bleed / flex container only reaches its real size after layout, and
    // the MapLibre GL canvas won't paint until it's nudged. Resize the Leaflet
    // map *and* the GL map, then re-run the latest camera fit.
    const settle = () => {
      if (!mapRef.current) return
      map.invalidateSize()
      const gl = (baseRef.current as unknown as {
        getMaplibreMap?: () => { resize: () => void; triggerRepaint: () => void }
      })?.getMaplibreMap?.()
      if (gl) {
        gl.resize()
        gl.triggerRepaint()
      }
      fitRef.current()
    }
    const ro = new ResizeObserver(settle)
    ro.observe(containerRef.current)
    requestAnimationFrame(settle)
    const timer = setTimeout(settle, 250)

    return () => {
      clearTimeout(timer)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      baseRef.current = null
      regionLayerRef.current = null
      spotLayerRef.current = null
      regionPathsRef.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap the basemap style on theme change — recolour the shapes. ───────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (baseRef.current) baseRef.current.remove()
    baseRef.current = L.maplibreGL({ style: mapStyle(isDarkTheme(themeId)) }).addTo(map)
    colorRef.current = accentColor()
    for (const path of regionPathsRef.current.values()) {
      path.setStyle({ color: colorRef.current, fillColor: colorRef.current })
    }
    spotLayerRef.current?.eachLayer(layer => {
      ;(layer as L.CircleMarker).setStyle?.({ fillColor: colorRef.current })
    })
  }, [themeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build region + break layers. Props are server-stable, so this is once. ─
  useEffect(() => {
    const map = mapRef.current
    const regionLayer = regionLayerRef.current
    const spotLayer = spotLayerRef.current
    if (!map || !regionLayer || !spotLayer) return

    colorRef.current = accentColor()
    const color = colorRef.current
    regionLayer.clearLayers()
    spotLayer.clearLayers()
    regionPathsRef.current.clear()

    const rest: L.PathOptions = { color, weight: 1.5, opacity: 0.5, fillColor: color, fillOpacity: 0.12 }
    const hover: L.PathOptions = { color, weight: 2.5, opacity: 0.95, fillColor: color, fillOpacity: 0.32 }
    const dim: L.PathOptions = { color, weight: 1, opacity: 0.28, fillColor: color, fillOpacity: 0.04 }
    const baseFor = () => (zoomedInRef.current ? dim : rest)

    for (const shape of shapes) {
      const path: L.Path = shape.isPoint
        ? L.circleMarker(shape.center, { radius: 8, ...rest })
        : L.polygon(shape.hull as [number, number][], rest)

      path.bindTooltip(shape.name, { sticky: true, direction: 'top', className: 'world-map-tip', opacity: 1 })
      path.on('mouseover', () => {
        path.setStyle(hover)
        ;(path as unknown as { bringToFront?: () => void }).bringToFront?.()
        onHoverRef.current?.(shape.slug)
      })
      path.on('mouseout', () => {
        path.setStyle(baseFor())
        onHoverRef.current?.(null)
      })
      path.on('click', () => onSelectRegionRef.current?.(shape.slug))
      path.addTo(regionLayer)
      regionPathsRef.current.set(shape.slug, path)
    }

    for (const sp of spots) {
      const marker = L.circleMarker([sp.lat, sp.lon], {
        radius: 4,
        color: '#fff',
        weight: 1.5,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 0.9,
      })
      marker.bindTooltip(sp.name, { direction: 'top', className: 'world-map-tip', opacity: 1 })
      marker.on('click', () => onSelectSpotRef.current?.(sp.slug))
      marker.addTo(spotLayer)
    }

    // Zoom-dependent reveal: region blobs at world zoom, break pins once you're in.
    applyZoomRef.current = () => {
      const m = mapRef.current
      if (!m) return
      zoomedInRef.current = m.getZoom() >= revealZoom
      if (zoomedInRef.current && !m.hasLayer(spotLayer)) spotLayer.addTo(m)
      if (!zoomedInRef.current && m.hasLayer(spotLayer)) m.removeLayer(spotLayer)
      for (const path of regionPathsRef.current.values()) path.setStyle(baseFor())
    }

    fitRef.current = () => {
      const m = mapRef.current
      if (!m) return
      const centers = shapes.map(s => s.center)
      if (centers.length === 0) {
        m.setView([18, 0], 2, { animate: false })
        return
      }
      m.fitBounds(L.latLngBounds(centers as [number, number][]), {
        padding: [40, 40],
        maxZoom: 3,
        animate: false,
      })
    }

    fitRef.current()
    applyZoomRef.current()
  }, [shapes, spots, revealZoom]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        .world-regions-map-container { width: 100%; height: 100%; }
        .world-regions-map-container .leaflet-container { background: var(--bg-start, #0b1220); font: inherit; }
        .world-regions-map-container .leaflet-interactive { cursor: pointer; }

        .world-map-tip {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--text-base, #e2e8f0) !important;
          border: 1px solid var(--card-border, rgba(255,255,255,0.1)) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45) !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 4px 8px !important;
        }
        .world-map-tip::before { display: none !important; }

        .world-regions-map-container .leaflet-control-zoom a {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--panel-label, #94a3b8) !important;
          border-color: var(--card-border, rgba(255,255,255,0.1)) !important;
        }
        .world-regions-map-container .leaflet-control-zoom a:hover {
          background: var(--panel-hover, #1e293b) !important;
          color: var(--text-base, #e2e8f0) !important;
        }
        .world-regions-map-container .leaflet-control-attribution {
          background: var(--panel-bg, #0f172a) !important;
          color: var(--panel-muted, #64748b) !important;
          font-size: 9px !important;
        }
        .world-regions-map-container .leaflet-control-attribution a { color: var(--panel-label, #94a3b8) !important; }
      `}</style>
      <div
        ref={containerRef}
        className="world-regions-map-container"
        style={{ background: 'var(--bg-start)' }}
      />
    </>
  )
}

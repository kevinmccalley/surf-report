// Pure geometry for the /regions/map world explorer — no Leaflet, no DOM, so
// it's unit-testable and safe to import from a server component.
//
// Each region's hover-highlight shape is the convex hull of its member breaks'
// coordinates (spec §6). Political borders don't fit — "Baja Sur" and
// "Southern California" aren't administrative units — but the hull of the
// breaks we actually plot *is* "the surf area", and it needs no GeoJSON.

import { getSurfRegions, getRegionSpots, type SurfRegion } from './surf-regions'
import { slugify } from './surf-spots'
import type { Continent } from './continents'

/** [lat, lon]. Treated as planar — fine at region scale, no region here spans ±180°. */
export type LatLon = [number, number]

/** Below this much hull area (deg²) a region is drawn as a marker, not a polygon. */
const MIN_POLYGON_AREA = 1e-4

function dedupe(points: readonly LatLon[]): LatLon[] {
  const seen = new Set<string>()
  const out: LatLon[] = []
  for (const [lat, lon] of points) {
    const key = `${lat},${lon}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push([lat, lon])
  }
  return out
}

/** Shoelace area of a simple polygon in degree² (always ≥ 0). */
export function polygonArea(ring: readonly LatLon[]): number {
  if (ring.length < 3) return 0
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const [y1, x1] = ring[i]
    const [y2, x2] = ring[(i + 1) % ring.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/**
 * Convex hull via Andrew's monotone chain, O(n log n). Input/output are
 * [lat, lon] pairs. Collinear points are dropped. Returns hull vertices with no
 * repeated closing point. Fewer than 3 non-collinear points → the unique input
 * points unchanged (caller renders a marker, not a polygon).
 */
export function convexHull(points: readonly LatLon[]): LatLon[] {
  const uniq = dedupe(points)
  if (uniq.length < 3) return uniq

  const pts = [...uniq].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: LatLon, a: LatLon, b: LatLon) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const lower: LatLon[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: LatLon[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  const hull = lower.concat(upper)
  return hull.length >= 3 ? hull : uniq
}

/**
 * Push every hull vertex out from its centroid by `factor` (0.18 ⇒ 18% larger).
 * A 3- or 4-break region is otherwise a hairline sliver; a little inflation
 * makes it read as an area without moving where the breaks sit.
 */
export function inflateHull(hull: readonly LatLon[], factor = 0.18): LatLon[] {
  if (hull.length < 3) return hull.map(([lat, lon]) => [lat, lon])
  const cLat = hull.reduce((s, p) => s + p[0], 0) / hull.length
  const cLon = hull.reduce((s, p) => s + p[1], 0) / hull.length
  return hull.map(([lat, lon]) => [
    cLat + (lat - cLat) * (1 + factor),
    cLon + (lon - cLon) * (1 + factor),
  ])
}

export interface RegionShape {
  slug: string
  name: string
  continent: Continent
  country: string
  /** Polygon centroid, or the region's own center when it's a point. */
  center: LatLon
  /** Inflated convex hull. 3+ vertices ⇒ polygon; ignored when `isPoint`. */
  hull: LatLon[]
  /** < 3 distinct breaks, or a degenerate (collinear) hull — draw a circle. */
  isPoint: boolean
  spotCount: number
}

/** Build the hover shape for one region from its plotted breaks. */
export function regionShape(region: SurfRegion): RegionShape {
  const pts: LatLon[] = getRegionSpots(region).map(s => [s.lat, s.lon])
  const hull = convexHull(pts)
  const isPoint = hull.length < 3 || polygonArea(hull) < MIN_POLYGON_AREA

  const center: LatLon = isPoint
    ? [region.center.lat, region.center.lon]
    : [
        hull.reduce((s, p) => s + p[0], 0) / hull.length,
        hull.reduce((s, p) => s + p[1], 0) / hull.length,
      ]

  return {
    slug: region.slug,
    name: region.name,
    continent: region.continent,
    country: region.country,
    center,
    hull: isPoint ? [] : inflateHull(hull),
    isPoint,
    spotCount: pts.length,
  }
}

/** Every region's hover shape, for the world map. */
export function getRegionShapes(): RegionShape[] {
  return getSurfRegions().map(regionShape)
}

export interface WorldSpot {
  slug: string
  name: string
  lat: number
  lon: number
  regionSlug: string
}

/**
 * Every plotted break across all regions, de-duped by slug — the zoomed-in
 * pin layer for the world map. A break belongs to exactly one region in the
 * catalog, so first-wins dedupe just guards against data drift.
 */
export function getWorldSpots(): WorldSpot[] {
  const seen = new Set<string>()
  const out: WorldSpot[] = []
  for (const region of getSurfRegions()) {
    for (const spot of getRegionSpots(region)) {
      const slug = slugify(spot.name)
      if (seen.has(slug)) continue
      seen.add(slug)
      out.push({ slug, name: spot.name, lat: spot.lat, lon: spot.lon, regionSlug: region.slug })
    }
  }
  return out
}

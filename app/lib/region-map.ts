// Pure camera math for RegionMap — no Leaflet, no DOM, so it's unit-testable
// and safe to import from a server component. RegionMap.tsx consumes this.

export interface RegionMapPoint {
  slug: string
  name: string
  lat: number
  lon: number
  locality?: string
}

export type FitTarget =
  | { kind: 'empty' }
  | { kind: 'point'; lat: number; lon: number; zoom: number }
  | { kind: 'bounds'; bounds: [[number, number], [number, number]] }

const SINGLE_POINT_ZOOM = 11

/**
 * Decide what the map camera should do for a set of spot coordinates.
 *
 * - explicit `override` bbox wins (a region's curated `bounds`)
 * - no points → 'empty' (caller shows the whole world)
 * - one point, or every point at the same coordinate → 'point' + a close zoom
 * - otherwise → the tight bounding box, [[south, west], [north, east]]
 *
 * The returned bounds are always well-ordered regardless of point order or
 * antimeridian-free input, so `L.fitBounds` can take them directly.
 */
export function regionFitTarget(
  points: readonly { lat: number; lon: number }[],
  override?: readonly [readonly [number, number], readonly [number, number]] | null,
): FitTarget {
  if (override) {
    const [[a, b], [c, d]] = override
    return {
      kind: 'bounds',
      bounds: [
        [Math.min(a, c), Math.min(b, d)],
        [Math.max(a, c), Math.max(b, d)],
      ],
    }
  }

  if (points.length === 0) return { kind: 'empty' }

  let south = Infinity
  let west = Infinity
  let north = -Infinity
  let east = -Infinity
  for (const p of points) {
    if (p.lat < south) south = p.lat
    if (p.lat > north) north = p.lat
    if (p.lon < west) west = p.lon
    if (p.lon > east) east = p.lon
  }

  if (south === north && west === east) {
    return { kind: 'point', lat: south, lon: west, zoom: SINGLE_POINT_ZOOM }
  }

  return { kind: 'bounds', bounds: [[south, west], [north, east]] }
}

/** Stable identity for a set of points — lets the map skip a re-fit when only selection changed. */
export function pointsKey(points: readonly { slug: string }[]): string {
  return points.map(p => p.slug).join('|')
}

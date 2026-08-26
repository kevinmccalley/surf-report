import { describe, it, expect } from 'vitest'
import { convexHull, inflateHull, polygonArea, regionShape, getRegionShapes, getWorldSpots, type LatLon } from '../region-hull'
import { getSurfRegions, getSurfRegionBySlug } from '../surf-regions'

describe('convexHull', () => {
  it('returns the points unchanged when there are fewer than 3', () => {
    expect(convexHull([])).toEqual([])
    expect(convexHull([[1, 2]])).toEqual([[1, 2]])
    expect(convexHull([[1, 2], [3, 4]])).toEqual([[1, 2], [3, 4]])
  })

  it('drops a point strictly inside the hull', () => {
    const square: LatLon[] = [[0, 0], [0, 10], [10, 10], [10, 0]]
    const withInterior: LatLon[] = [...square, [5, 5]]
    const hull = convexHull(withInterior)
    expect(hull).toHaveLength(4)
    expect(hull).not.toContainEqual([5, 5])
  })

  it('every hull vertex is one of the input points', () => {
    const pts: LatLon[] = [[33.4, -117.6], [34.4, -119.5], [32.8, -117.3], [33.7, -118.4], [33.0, -118.0]]
    for (const v of convexHull(pts)) {
      expect(pts).toContainEqual(v)
    }
  })

  it('contains every input point inside or on the boundary', () => {
    const pts: LatLon[] = [[0, 0], [2, 8], [9, 9], [10, 1], [4, 3], [6, 7]]
    const hull = convexHull(pts)
    // Sum of triangle areas from each point to every hull edge equals the hull
    // area exactly ⇔ the point is inside/on the hull.
    const area = polygonArea(hull)
    for (const p of pts) {
      let acc = 0
      for (let i = 0; i < hull.length; i++) {
        acc += polygonArea([p, hull[i], hull[(i + 1) % hull.length]])
      }
      expect(acc).toBeCloseTo(area, 6)
    }
  })

  it('collapses collinear points to the two endpoints — degenerate hull', () => {
    const line: LatLon[] = [[0, 0], [1, 1], [2, 2], [3, 3]]
    const hull = convexHull(line)
    // monotone chain can't form a triangle → falls back to the unique points
    expect(polygonArea(hull)).toBeCloseTo(0, 9)
  })
})

describe('polygonArea', () => {
  it('is zero below a triangle', () => {
    expect(polygonArea([])).toBe(0)
    expect(polygonArea([[0, 0], [1, 1]])).toBe(0)
  })
  it('is orientation-independent', () => {
    const ring: LatLon[] = [[0, 0], [0, 4], [3, 4], [3, 0]]
    expect(polygonArea(ring)).toBeCloseTo(12)
    expect(polygonArea([...ring].reverse())).toBeCloseTo(12)
  })
})

describe('inflateHull', () => {
  it('grows the shape but keeps the centroid put', () => {
    const hull: LatLon[] = [[0, 0], [0, 10], [10, 10], [10, 0]]
    const bigger = inflateHull(hull, 0.2)
    expect(polygonArea(bigger)).toBeGreaterThan(polygonArea(hull))
    const cLat = bigger.reduce((s, p) => s + p[0], 0) / bigger.length
    const cLon = bigger.reduce((s, p) => s + p[1], 0) / bigger.length
    expect(cLat).toBeCloseTo(5)
    expect(cLon).toBeCloseTo(5)
  })
  it('leaves a sub-triangle untouched', () => {
    expect(inflateHull([[1, 2], [3, 4]])).toEqual([[1, 2], [3, 4]])
  })
})

describe('regionShape', () => {
  it('makes a polygon for a multi-break region', () => {
    const socal = getSurfRegionBySlug('southern-california')!
    const shape = regionShape(socal)
    expect(shape.isPoint).toBe(false)
    expect(shape.hull.length).toBeGreaterThanOrEqual(3)
    expect(shape.spotCount).toBeGreaterThan(3)
  })

  it('makes a point for a single-break region', () => {
    const noronha = getSurfRegionBySlug('fernando-de-noronha')!
    const shape = regionShape(noronha)
    expect(shape.isPoint).toBe(true)
    expect(shape.hull).toEqual([])
    expect(shape.center).toEqual([noronha.center.lat, noronha.center.lon])
  })
})

describe('getRegionShapes', () => {
  it('returns one shape per region, each with a finite center', () => {
    const shapes = getRegionShapes()
    expect(shapes).toHaveLength(getSurfRegions().length)
    for (const s of shapes) {
      expect(Number.isFinite(s.center[0])).toBe(true)
      expect(Number.isFinite(s.center[1])).toBe(true)
      if (!s.isPoint) expect(polygonArea(s.hull)).toBeGreaterThan(0)
    }
  })
})

describe('getWorldSpots', () => {
  it('has no duplicate slugs and every spot names a real region', () => {
    const spots = getWorldSpots()
    const slugs = spots.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of spots) {
      expect(getSurfRegionBySlug(s.regionSlug)).toBeDefined()
      expect(Number.isFinite(s.lat)).toBe(true)
      expect(Number.isFinite(s.lon)).toBe(true)
    }
  })
})

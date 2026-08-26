import { describe, it, expect } from 'vitest'
import { regionFitTarget, pointsKey } from '../region-map'

describe('regionFitTarget', () => {
  it('returns empty for no points', () => {
    expect(regionFitTarget([])).toEqual({ kind: 'empty' })
  })

  it('returns a close point view for a single spot', () => {
    const t = regionFitTarget([{ lat: 21.66, lon: -158.05 }])
    expect(t).toEqual({ kind: 'point', lat: 21.66, lon: -158.05, zoom: 11 })
  })

  it('treats every-point-identical as a point view', () => {
    const t = regionFitTarget([
      { lat: 10, lon: 20 },
      { lat: 10, lon: 20 },
    ])
    expect(t).toEqual({ kind: 'point', lat: 10, lon: 20, zoom: 11 })
  })

  it('returns a well-ordered bbox enclosing every point', () => {
    const pts = [
      { lat: 33.4, lon: -117.6 },
      { lat: 34.4, lon: -119.5 },
      { lat: 32.8, lon: -117.3 },
    ]
    const t = regionFitTarget(pts)
    expect(t.kind).toBe('bounds')
    if (t.kind !== 'bounds') return
    const [[s, w], [n, e]] = t.bounds
    expect(s).toBeLessThanOrEqual(n)
    expect(w).toBeLessThanOrEqual(e)
    for (const p of pts) {
      expect(p.lat).toBeGreaterThanOrEqual(s)
      expect(p.lat).toBeLessThanOrEqual(n)
      expect(p.lon).toBeGreaterThanOrEqual(w)
      expect(p.lon).toBeLessThanOrEqual(e)
    }
    expect(t.bounds).toEqual([[32.8, -119.5], [34.4, -117.3]])
  })

  it('honours an override bbox and normalises its corner order', () => {
    const t = regionFitTarget(
      [{ lat: 0, lon: 0 }],
      [[10, 20], [-5, -8]], // deliberately [[N,E],[S,W]]
    )
    expect(t).toEqual({ kind: 'bounds', bounds: [[-5, -8], [10, 20]] })
  })
})

describe('pointsKey', () => {
  it('is stable for the same points', () => {
    const pts = [{ slug: 'a' }, { slug: 'b' }]
    expect(pointsKey(pts)).toBe(pointsKey(pts))
  })

  it('is order-sensitive', () => {
    expect(pointsKey([{ slug: 'a' }, { slug: 'b' }])).not.toBe(pointsKey([{ slug: 'b' }, { slug: 'a' }]))
  })

  it('changes when a point is added or removed', () => {
    expect(pointsKey([{ slug: 'a' }])).not.toBe(pointsKey([{ slug: 'a' }, { slug: 'b' }]))
  })
})

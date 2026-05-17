import { describe, it, expect } from 'vitest'
import { computeSurfRating } from '../surf-rating'

// Helper: call with common defaults, override what you need
function rate(
  waveHeight: number,
  { period = 10, swellPeriod = 10, wind = 5 }: { period?: number; swellPeriod?: number; wind?: number } = {}
) {
  return computeSurfRating(waveHeight, period, waveHeight * 0.8, swellPeriod, wind)
}

// ── FLAT ─────────────────────────────────────────────────────────────────────

describe('computeSurfRating — FLAT', () => {
  it('returns FLAT when waveHeight is 0', () => {
    expect(rate(0).label).toBe('FLAT')
  })

  it('returns FLAT when waveHeight is below 0.15m', () => {
    expect(rate(0.14).label).toBe('FLAT')
  })

  it('FLAT has score of 0', () => {
    expect(rate(0).score).toBe(0)
  })

  it('FLAT has the grey color', () => {
    expect(rate(0).color).toBe('#6b7280')
  })

  it('is NOT FLAT at exactly 0.15m', () => {
    expect(rate(0.15).label).not.toBe('FLAT')
  })
})

// ── POOR ─────────────────────────────────────────────────────────────────────

describe('computeSurfRating — POOR', () => {
  it('returns POOR for tiny waves with strong wind', () => {
    // waveHeight=0.2 (hs=0.5), period=4 (ps=0), wind=45 (ws=0) → total=0.5
    const r = computeSurfRating(0.2, 4, 0.1, 4, 45)
    expect(r.label).toBe('POOR')
  })

  it('POOR score is less than 1.5', () => {
    const r = computeSurfRating(0.2, 4, 0.1, 4, 45)
    expect(r.score).toBeLessThan(1.5)
  })
})

// ── POOR TO FAIR ─────────────────────────────────────────────────────────────

describe('computeSurfRating — POOR TO FAIR', () => {
  it('returns POOR TO FAIR for mediocre conditions', () => {
    // hs=1.5, ps=0.6 (period=7), ws=0.8 (wind=25) → total=2.9
    const r = computeSurfRating(0.4, 7, 0.3, 7, 25)
    expect(r.label).toBe('POOR TO FAIR')
  })

  it('POOR TO FAIR score is between 1.5 and 3.5', () => {
    const r = computeSurfRating(0.4, 7, 0.3, 7, 25)
    expect(r.score).toBeGreaterThanOrEqual(1.5)
    expect(r.score).toBeLessThan(3.5)
  })
})

// ── FAIR ─────────────────────────────────────────────────────────────────────

describe('computeSurfRating — FAIR', () => {
  it('returns FAIR for decent waves with onshore wind', () => {
    // hs=2.5, ps=1.2 (period=8), ws=0.3 (wind=30) → total=4.0
    const r = computeSurfRating(0.7, 8, 0.5, 8, 30)
    expect(r.label).toBe('FAIR')
  })

  it('FAIR score is between 3.5 and 5.0', () => {
    const r = computeSurfRating(0.7, 8, 0.5, 8, 30)
    expect(r.score).toBeGreaterThanOrEqual(3.5)
    expect(r.score).toBeLessThan(5.0)
  })
})

// ── FAIR TO GOOD ─────────────────────────────────────────────────────────────

describe('computeSurfRating — FAIR TO GOOD', () => {
  it('returns FAIR TO GOOD for head-high waves with moderate wind', () => {
    // hs=2.5, ps=1.7 (period=10), ws=0.8 (wind=25) → total=5.0
    const r = computeSurfRating(0.8, 10, 0.6, 10, 25)
    expect(r.label).toBe('FAIR TO GOOD')
  })

  it('FAIR TO GOOD score is between 5.0 and 6.5', () => {
    const r = computeSurfRating(0.8, 10, 0.6, 10, 25)
    expect(r.score).toBeGreaterThanOrEqual(5.0)
    expect(r.score).toBeLessThan(6.5)
  })
})

// ── GOOD ─────────────────────────────────────────────────────────────────────

describe('computeSurfRating — GOOD', () => {
  it('returns GOOD for solid overhead waves with light wind', () => {
    // hs=3.2, ps=1.7 (period=10), ws=2.4 (wind=10) → total=7.3
    const r = computeSurfRating(1.2, 10, 1.0, 10, 10)
    expect(r.label).toBe('GOOD')
  })

  it('GOOD score is between 6.5 and 7.8', () => {
    const r = computeSurfRating(1.2, 10, 1.0, 10, 10)
    expect(r.score).toBeGreaterThanOrEqual(6.5)
    expect(r.score).toBeLessThan(7.8)
  })
})

// ── VERY GOOD ─────────────────────────────────────────────────────────────────

describe('computeSurfRating — VERY GOOD', () => {
  it('returns VERY GOOD for double-overhead with long period', () => {
    // hs=3.7, ps=2.2 (period=14), ws=2.4 (wind=8) → total=8.3
    const r = computeSurfRating(1.5, 14, 1.2, 14, 8)
    expect(r.label).toBe('VERY GOOD')
  })

  it('VERY GOOD score is between 7.8 and 9.0', () => {
    const r = computeSurfRating(1.5, 14, 1.2, 14, 8)
    expect(r.score).toBeGreaterThanOrEqual(7.8)
    expect(r.score).toBeLessThan(9.0)
  })
})

// ── EPIC ─────────────────────────────────────────────────────────────────────

describe('computeSurfRating — EPIC', () => {
  it('returns EPIC for large, well-groomed, long-period swell', () => {
    // hs=3.7, ps=3.0 (period=18), ws=3.0 (wind=5) → total=9.7
    const r = computeSurfRating(2.0, 18, 1.8, 18, 5)
    expect(r.label).toBe('EPIC')
  })

  it('EPIC score is 9.0 or above', () => {
    const r = computeSurfRating(2.0, 18, 1.8, 18, 5)
    expect(r.score).toBeGreaterThanOrEqual(9.0)
  })

  it('returns EPIC color #a855f7', () => {
    const r = computeSurfRating(2.0, 18, 1.8, 18, 5)
    expect(r.color).toBe('#a855f7')
  })
})

// ── Period scoring uses max(wavePeriod, swellPeriod) ─────────────────────────

describe('computeSurfRating — period logic', () => {
  it('uses swellPeriod when it is longer than wavePeriod', () => {
    // Same wave height and wind; long swell bumps up the score
    const short = computeSurfRating(1.0, 6, 0.8, 6, 5)
    const long  = computeSurfRating(1.0, 6, 0.8, 14, 5)
    expect(long.score).toBeGreaterThan(short.score)
  })

  it('uses wavePeriod when it is longer than swellPeriod', () => {
    const r = computeSurfRating(1.0, 14, 0.8, 6, 5)
    // effectivePeriod=14 → ps=2.2
    expect(r.score).toBeGreaterThan(computeSurfRating(1.0, 6, 0.8, 6, 5).score)
  })
})

// ── Wind scoring ──────────────────────────────────────────────────────────────

describe('computeSurfRating — wind scoring', () => {
  it('calm wind (<8 km/h) gives maximum wind score', () => {
    const calm  = computeSurfRating(1.0, 10, 0.8, 10, 5)
    const breezy = computeSurfRating(1.0, 10, 0.8, 10, 20)
    expect(calm.score).toBeGreaterThan(breezy.score)
  })

  it('gale-force wind (>=40 km/h) gives zero wind score', () => {
    const r = computeSurfRating(0.5, 10, 0.4, 10, 40)
    // ws=0, hs=1.5, ps=1.2 → total=2.7 < 3.5 → POOR TO FAIR
    expect(['POOR', 'POOR TO FAIR']).toContain(r.label)
  })
})

// ── Return shape ──────────────────────────────────────────────────────────────

describe('computeSurfRating — return shape', () => {
  it('always returns label, score, color, bgColor, textColor', () => {
    const r = computeSurfRating(1.0, 10, 0.8, 10, 10)
    expect(r).toHaveProperty('label')
    expect(r).toHaveProperty('score')
    expect(r).toHaveProperty('color')
    expect(r).toHaveProperty('bgColor')
    expect(r).toHaveProperty('textColor')
  })

  it('score is a finite number', () => {
    const r = computeSurfRating(1.0, 10, 0.8, 10, 10)
    expect(Number.isFinite(r.score)).toBe(true)
  })
})

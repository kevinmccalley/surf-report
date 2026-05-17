import { describe, it, expect, vi, beforeEach } from 'vitest'
import { directionLabel, circularMean, computeClimatology } from '../climatology'

// next/cache is not available outside Next.js — stub it so the module loads
vi.mock('next/cache', () => ({
  unstable_cache: <T extends () => unknown>(fn: T) => fn,
}))

// ── directionLabel ────────────────────────────────────────────────────────────

describe('directionLabel', () => {
  it('0° → N', () => expect(directionLabel(0)).toBe('N'))
  it('22.5° → NNE', () => expect(directionLabel(22.5)).toBe('NNE'))
  it('45° → NE', () => expect(directionLabel(45)).toBe('NE'))
  it('90° → E', () => expect(directionLabel(90)).toBe('E'))
  it('135° → SE', () => expect(directionLabel(135)).toBe('SE'))
  it('180° → S', () => expect(directionLabel(180)).toBe('S'))
  it('225° → SW', () => expect(directionLabel(225)).toBe('SW'))
  it('270° → W', () => expect(directionLabel(270)).toBe('W'))
  it('315° → NW', () => expect(directionLabel(315)).toBe('NW'))
  it('337.5° → NNW', () => expect(directionLabel(337.5)).toBe('NNW'))
  it('360° wraps back to N', () => expect(directionLabel(360)).toBe('N'))
})

// ── circularMean ──────────────────────────────────────────────────────────────

describe('circularMean', () => {
  it('returns 0 for empty array', () => {
    expect(circularMean([])).toBe(0)
  })

  it('single angle returns itself', () => {
    expect(circularMean([90])).toBeCloseTo(90, 1)
  })

  it('identical angles return that angle', () => {
    expect(circularMean([45, 45, 45])).toBeCloseTo(45, 1)
  })

  it('correctly wraps 0° and 360° — mean is 0, not 180', () => {
    expect(circularMean([0, 360])).toBeCloseTo(0, 1)
  })

  it('averages 10° and 350° to ~0° (not 180°)', () => {
    const mean = circularMean([10, 350])
    // Result should be near 0 (north), not 180 (south)
    expect(mean < 20 || mean > 340).toBe(true)
  })

  it('averages due East (90°) angles correctly', () => {
    expect(circularMean([90, 90])).toBeCloseTo(90, 1)
  })

  it('averages NW and NE to roughly N (360/0)', () => {
    const mean = circularMean([315, 45]) // NW + NE
    expect(mean < 10 || mean > 350).toBe(true)
  })

  it('result is always in [0, 360)', () => {
    const angles = [350, 355, 5, 10]
    const mean = circularMean(angles)
    expect(mean).toBeGreaterThanOrEqual(0)
    expect(mean).toBeLessThan(360)
  })
})

// ── computeClimatology ────────────────────────────────────────────────────────

function makeFakeMarineYear(year: number) {
  // Generate hourly times for Jan–Dec with constant values for easy assertions
  const times: string[] = []
  const waveHeight: number[] = []
  const wavePeriod: number[] = []
  const swellHeight: number[] = []
  const swellPeriod: number[] = []
  const swellDir: number[] = []

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < daysInMonth[m]; d++) {
      for (let h = 0; h < 24; h++) {
        const mm = String(m + 1).padStart(2, '0')
        const dd = String(d + 1).padStart(2, '0')
        const hh = String(h).padStart(2, '0')
        times.push(`${year}-${mm}-${dd}T${hh}:00`)
        // Jan = month 1: wave=1.0m; Jul = month 7: wave=2.0m; others scale linearly
        waveHeight.push(1.0 + (m / 11))
        wavePeriod.push(10)
        swellHeight.push(0.8)
        swellPeriod.push(12)
        swellDir.push(180) // constant S swell
      }
    }
  }
  return { times, waveHeight, wavePeriod, swellHeight, swellPeriod, swellDir }
}

describe('computeClimatology', () => {
  beforeEach(() => {
    const makeResponse = (year: number) => ({
      ok: true,
      json: async () => ({
        hourly: {
          time: makeFakeMarineYear(year).times,
          wave_height: makeFakeMarineYear(year).waveHeight,
          wave_period: makeFakeMarineYear(year).wavePeriod,
          swell_wave_height: makeFakeMarineYear(year).swellHeight,
          swell_wave_period: makeFakeMarineYear(year).swellPeriod,
          swell_wave_direction: makeFakeMarineYear(year).swellDir,
        },
      }),
    })

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(makeResponse(2022))
      .mockResolvedValueOnce(makeResponse(2023))
      .mockResolvedValueOnce(makeResponse(2024)),
    )
  })

  it('returns exactly 12 months', async () => {
    const months = await computeClimatology(21.7, -158.0)
    expect(months).toHaveLength(12)
  })

  it('month numbers run 1–12', async () => {
    const months = await computeClimatology(21.7, -158.0)
    expect(months.map(m => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('month names are correct English names', async () => {
    const months = await computeClimatology(21.7, -158.0)
    expect(months[0].name).toBe('January')
    expect(months[6].name).toBe('July')
    expect(months[11].name).toBe('December')
  })

  it('avgHs is a positive number', async () => {
    const months = await computeClimatology(21.7, -158.0)
    for (const m of months) {
      expect(m.avgHs).toBeGreaterThan(0)
    }
  })

  it('avgPeriod reflects the constant 10s input', async () => {
    const months = await computeClimatology(21.7, -158.0)
    for (const m of months) {
      expect(m.avgPeriod).toBeCloseTo(10, 0)
    }
  })

  it('sampleSize is positive for all months', async () => {
    const months = await computeClimatology(21.7, -158.0)
    for (const m of months) {
      expect(m.sampleSize).toBeGreaterThan(0)
    }
  })

  it('dominantDirectionLabel is S for constant 180° swell', async () => {
    const months = await computeClimatology(21.7, -158.0)
    for (const m of months) {
      expect(m.dominantDirectionLabel).toBe('S')
    }
  })

  it('score formula: min(avgHs,3)*2 + min(avgSwellPeriod,14)*0.3', async () => {
    const months = await computeClimatology(21.7, -158.0)
    for (const m of months) {
      // score is computed from unrounded intermediates, so use 1-decimal tolerance
      const expected = Math.min(m.avgHs, 3.0) * 2 + Math.min(m.avgSwellPeriod, 14) * 0.3
      expect(m.score).toBeCloseTo(expected, 1)
    }
  })

  it('gracefully handles a failed fetch year (returns null) by using remaining years', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new Error('network'))     // 2022 fails
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hourly: { time: makeFakeMarineYear(2023).times, wave_height: makeFakeMarineYear(2023).waveHeight, wave_period: makeFakeMarineYear(2023).wavePeriod, swell_wave_height: makeFakeMarineYear(2023).swellHeight, swell_wave_period: makeFakeMarineYear(2023).swellPeriod, swell_wave_direction: makeFakeMarineYear(2023).swellDir } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hourly: { time: makeFakeMarineYear(2024).times, wave_height: makeFakeMarineYear(2024).waveHeight, wave_period: makeFakeMarineYear(2024).wavePeriod, swell_wave_height: makeFakeMarineYear(2024).swellHeight, swell_wave_period: makeFakeMarineYear(2024).swellPeriod, swell_wave_direction: makeFakeMarineYear(2024).swellDir } }) }),
    )
    const months = await computeClimatology(21.7, -158.0)
    expect(months).toHaveLength(12)
    // Still gets data from the two good years
    expect(months[0].sampleSize).toBeGreaterThan(0)
  })
})

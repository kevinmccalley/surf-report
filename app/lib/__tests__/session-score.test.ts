import { describe, it, expect } from 'vitest'
import { scoreHours, findBestWindows } from '../session-score'
import type { HourlyForecast, TideHeight } from '../types'
import type { ScoredHour } from '../session-score'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeHour(time: string, overrides: Partial<HourlyForecast> = {}): HourlyForecast {
  return {
    waveHeight: 1.2,
    wavePeriod: 10,
    swellHeight: 1.0,
    swellPeriod: 12,
    swellDirection: 180,
    windWaveHeight: 0.3,
    windWavePeriod: 5,
    windWaveDirection: 180,
    swell2Height: 0,
    swell2Period: 0,
    swell2Direction: 0,
    swell3Height: 0,
    swell3Period: 0,
    swell3Direction: 0,
    windSpeed: 10,
    windDirection: 225,
    weatherCode: 1,
    time,
    ...overrides,
  }
}

function makeTide(time: string, height: number): TideHeight {
  return { time, height }
}

// Build a ScoredHour with a specific compositeScore for findBestWindows tests
function makeScoredHour(time: string, compositeScore: number, tideTrend: 'rising' | 'falling' | 'slack' = 'rising'): ScoredHour {
  return {
    time,
    surfScore: Math.max(0, compositeScore - 1),
    compositeScore,
    rating: { label: 'GOOD', score: compositeScore - 1, color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)', textColor: '#86efac' },
    waveHeight: 1.2,
    wavePeriod: 10,
    windSpeed: 10,
    windDirection: 225,
    tideHeight: 1.5,
    tideTrend,
  }
}

// ── scoreHours ────────────────────────────────────────────────────────────────

describe('scoreHours', () => {
  it('returns one scored hour per hourly input', () => {
    const hourly = [makeHour('2025-05-13T07:00'), makeHour('2025-05-13T08:00')]
    const result = scoreHours(hourly, [])
    expect(result).toHaveLength(2)
  })

  it('each result has time matching its input', () => {
    const hourly = [makeHour('2025-05-13T07:00'), makeHour('2025-05-13T09:00')]
    const result = scoreHours(hourly, [])
    expect(result[0].time).toBe('2025-05-13T07:00')
    expect(result[1].time).toBe('2025-05-13T09:00')
  })

  it('flat wave gives surfScore of 0', () => {
    const hourly = [makeHour('2025-05-13T07:00', { waveHeight: 0.05 })]
    const result = scoreHours(hourly, [])
    expect(result[0].surfScore).toBe(0)
    expect(result[0].rating.label).toBe('FLAT')
  })

  it('compositeScore = surfScore + tideBonus', () => {
    // No tides → tideTrend = 'slack' → tideBonus = 1.0
    const hourly = [makeHour('2025-05-13T07:00', { waveHeight: 1.2, wavePeriod: 10, windSpeed: 10 })]
    const result = scoreHours(hourly, [])
    expect(result[0].compositeScore).toBeCloseTo(result[0].surfScore + 1.0, 5)
  })

  it('rising tide adds bonus of 1.5', () => {
    const time = '2025-05-13T07:00'
    const tides = [
      makeTide('2025-05-13T06:00', 0.5),
      makeTide('2025-05-13T07:00', 1.0),
      makeTide('2025-05-13T08:00', 1.6), // rising: next - prev = 1.1 > 0.08
    ]
    const hourly = [makeHour(time)]
    const result = scoreHours(hourly, tides)
    expect(result[0].tideTrend).toBe('rising')
    expect(result[0].compositeScore).toBeCloseTo(result[0].surfScore + 1.5, 5)
  })

  it('falling tide adds bonus of 0.5', () => {
    const time = '2025-05-13T07:00'
    const tides = [
      makeTide('2025-05-13T06:00', 1.6),
      makeTide('2025-05-13T07:00', 1.0),
      makeTide('2025-05-13T08:00', 0.5), // falling: next - prev = -1.1 < -0.08
    ]
    const hourly = [makeHour(time)]
    const result = scoreHours(hourly, tides)
    expect(result[0].tideTrend).toBe('falling')
    expect(result[0].compositeScore).toBeCloseTo(result[0].surfScore + 0.5, 5)
  })

  it('slack tide (change < 0.08m) adds bonus of 1.0', () => {
    const time = '2025-05-13T07:00'
    const tides = [
      makeTide('2025-05-13T06:00', 1.0),
      makeTide('2025-05-13T07:00', 1.0),
      makeTide('2025-05-13T08:00', 1.05), // change = 0.05 < 0.08 → slack
    ]
    const hourly = [makeHour(time)]
    const result = scoreHours(hourly, tides)
    expect(result[0].tideTrend).toBe('slack')
    expect(result[0].compositeScore).toBeCloseTo(result[0].surfScore + 1.0, 5)
  })

  it('no matching tide returns slack and null height', () => {
    const hourly = [makeHour('2025-05-13T07:00')]
    const tides = [makeTide('2025-05-14T07:00', 1.0)] // different day
    const result = scoreHours(hourly, tides)
    expect(result[0].tideTrend).toBe('slack')
    expect(result[0].tideHeight).toBeNull()
  })

  it('waveHeight is preserved in output', () => {
    const hourly = [makeHour('2025-05-13T07:00', { waveHeight: 2.5 })]
    const result = scoreHours(hourly, [])
    expect(result[0].waveHeight).toBe(2.5)
  })
})

// ── findBestWindows ───────────────────────────────────────────────────────────

describe('findBestWindows', () => {
  it('returns empty array for fewer than 2 hours', () => {
    expect(findBestWindows([])).toEqual([])
    expect(findBestWindows([makeScoredHour('T0', 5)])).toEqual([])
  })

  it('returns one window for exactly 2 hours', () => {
    const scored = [
      makeScoredHour('2025-05-13T07:00', 5),
      makeScoredHour('2025-05-13T08:00', 5),
    ]
    const result = findBestWindows(scored)
    expect(result).toHaveLength(1)
  })

  it('default count is 2', () => {
    const scored = Array.from({ length: 8 }, (_, i) =>
      makeScoredHour(`2025-05-13T0${i}:00`, i + 1),
    )
    const result = findBestWindows(scored)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('respects the count parameter', () => {
    const scored = Array.from({ length: 8 }, (_, i) =>
      makeScoredHour(`2025-05-13T0${i}:00`, 5),
    )
    expect(findBestWindows(scored, 1)).toHaveLength(1)
  })

  it('picks the highest-scoring non-overlapping windows', () => {
    // Hours 0,1 score 8; hours 4,5 score 7; hours 2,3 score 1
    const scored = [
      makeScoredHour('2025-05-13T00:00', 8),
      makeScoredHour('2025-05-13T01:00', 8),
      makeScoredHour('2025-05-13T02:00', 1),
      makeScoredHour('2025-05-13T03:00', 1),
      makeScoredHour('2025-05-13T04:00', 7),
      makeScoredHour('2025-05-13T05:00', 7),
    ]
    const result = findBestWindows(scored)
    expect(result[0].startTime).toBe('2025-05-13T00:00')
    expect(result[1].startTime).toBe('2025-05-13T04:00')
  })

  it('windows do not overlap (gap of at least one hour between them)', () => {
    const scored = Array.from({ length: 10 }, (_, i) =>
      makeScoredHour(`2025-05-13T${String(i).padStart(2, '0')}:00`, 10 - i),
    )
    const result = findBestWindows(scored)
    if (result.length >= 2) {
      const t0 = new Date(result[0].startTime).getTime()
      const t1 = new Date(result[1].startTime).getTime()
      const diffHours = (t1 - t0) / (1000 * 60 * 60)
      expect(diffHours).toBeGreaterThanOrEqual(3)
    }
  })

  it('result is sorted chronologically', () => {
    const scored = [
      makeScoredHour('2025-05-13T00:00', 5),
      makeScoredHour('2025-05-13T01:00', 3),
      makeScoredHour('2025-05-13T02:00', 1),
      makeScoredHour('2025-05-13T03:00', 1),
      makeScoredHour('2025-05-13T04:00', 8),
      makeScoredHour('2025-05-13T05:00', 8),
    ]
    const result = findBestWindows(scored)
    if (result.length >= 2) {
      expect(result[0].startTime < result[1].startTime).toBe(true)
    }
  })

  it('assigns rank 1 to the best window', () => {
    const scored = [
      makeScoredHour('2025-05-13T00:00', 9),
      makeScoredHour('2025-05-13T01:00', 9),
      makeScoredHour('2025-05-13T02:00', 1),
      makeScoredHour('2025-05-13T03:00', 1),
      makeScoredHour('2025-05-13T04:00', 5),
      makeScoredHour('2025-05-13T05:00', 5),
    ]
    const result = findBestWindows(scored)
    const best = result.find(w => w.meanScore === Math.max(...result.map(r => r.meanScore)))
    expect(best?.rank).toBe(1)
  })

  it('each window contains exactly 2 hours', () => {
    const scored = Array.from({ length: 6 }, (_, i) =>
      makeScoredHour(`2025-05-13T0${i}:00`, 5),
    )
    const result = findBestWindows(scored)
    for (const w of result) {
      expect(w.hours).toHaveLength(2)
    }
  })

  it('computes tideState as majority trend of the 2 hours', () => {
    const scored = [
      makeScoredHour('2025-05-13T07:00', 6, 'rising'),
      makeScoredHour('2025-05-13T08:00', 6, 'rising'),
      makeScoredHour('2025-05-13T09:00', 1, 'slack'),
      makeScoredHour('2025-05-13T10:00', 1, 'slack'),
      makeScoredHour('2025-05-13T11:00', 3, 'falling'),
      makeScoredHour('2025-05-13T12:00', 3, 'falling'),
    ]
    const result = findBestWindows(scored)
    expect(result[0].tideState).toBe('rising')
  })
})

import type { HourlyForecast, TideHeight, SurfRating } from './types'
import { computeSurfRating } from './surf-rating'

export interface ScoredHour {
  time: string
  surfScore: number
  compositeScore: number
  rating: SurfRating
  waveHeight: number
  wavePeriod: number
  windSpeed: number
  windDirection: number
  tideHeight: number | null
  tideTrend: 'rising' | 'falling' | 'slack'
}

export interface SessionWindow {
  startTime: string   // ISO local time, e.g. "2025-05-13T07:00"
  meanScore: number
  hours: ScoredHour[] // the 2 constituent hours
  avgWaveHeight: number
  avgPeriod: number
  avgWindSpeed: number
  tideState: 'rising' | 'falling' | 'slack'
  rank: number        // 1 = best, 2 = runner-up
}

function getTideInfo(
  time: string,
  tideHourly: TideHeight[]
): { trend: 'rising' | 'falling' | 'slack'; height: number | null } {
  if (!tideHourly.length) return { trend: 'slack', height: null }

  const prefix = time.substring(0, 13) // "YYYY-MM-DDTHH"
  const idx = tideHourly.findIndex(t => t.time.substring(0, 13) === prefix)
  if (idx < 0) return { trend: 'slack', height: null }

  const height = tideHourly[idx].height
  const prev = tideHourly[idx - 1]?.height
  const next = tideHourly[idx + 1]?.height

  if (prev === undefined || next === undefined) return { trend: 'slack', height }
  const change = next - prev
  if (Math.abs(change) < 0.08) return { trend: 'slack', height }
  return { trend: change > 0 ? 'rising' : 'falling', height }
}

export function scoreHours(
  hourly: HourlyForecast[],
  tideHourly: TideHeight[]
): ScoredHour[] {
  return hourly.map(h => {
    const rating = computeSurfRating(
      h.waveHeight, h.wavePeriod,
      h.swellHeight, h.swellPeriod,
      h.windSpeed
    )
    const { trend, height } = getTideInfo(h.time, tideHourly)
    // Rising tide is generally most favorable; slack is neutral; falling least
    const tideBonus = trend === 'rising' ? 1.5 : trend === 'slack' ? 1.0 : 0.5
    return {
      time: h.time,
      surfScore: rating.score,
      compositeScore: rating.score + tideBonus,
      rating,
      waveHeight: h.waveHeight,
      wavePeriod: h.wavePeriod,
      windSpeed: h.windSpeed,
      windDirection: h.windDirection,
      tideHeight: height,
      tideTrend: trend,
    }
  })
}

export function findBestWindows(scored: ScoredHour[], count = 2): SessionWindow[] {
  if (scored.length < 2) return []

  // Build all candidate 2-hour windows
  const candidates = scored.slice(0, scored.length - 1).map((_, i) => {
    const pair = scored.slice(i, i + 2)
    const meanScore = (pair[0].compositeScore + pair[1].compositeScore) / 2
    const tideCounts = { rising: 0, falling: 0, slack: 0 }
    pair.forEach(h => { tideCounts[h.tideTrend]++ })
    const tideState = (
      Object.entries(tideCounts).sort((a, b) => b[1] - a[1])[0][0]
    ) as 'rising' | 'falling' | 'slack'
    return {
      startTime: pair[0].time,
      meanScore,
      hours: pair,
      avgWaveHeight: (pair[0].waveHeight + pair[1].waveHeight) / 2,
      avgPeriod: (pair[0].wavePeriod + pair[1].wavePeriod) / 2,
      avgWindSpeed: (pair[0].windSpeed + pair[1].windSpeed) / 2,
      tideState,
      rank: 0,
      _startIdx: i,
    }
  })

  candidates.sort((a, b) => b.meanScore - a.meanScore)

  // Greedy selection: pick best non-overlapping windows
  const result: SessionWindow[] = []
  const excluded = new Set<number>()

  for (const c of candidates) {
    if (excluded.has(c._startIdx) || excluded.has(c._startIdx + 1)) continue
    result.push({ ...c, rank: result.length + 1 })
    // Block adjacent indices so windows don't overlap
    for (let d = -1; d <= 2; d++) excluded.add(c._startIdx + d)
    if (result.length >= count) break
  }

  // Return chronologically so the UI can render them in time order
  return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

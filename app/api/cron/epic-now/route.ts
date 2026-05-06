import { NextRequest, NextResponse } from 'next/server'
import { rset } from '@/app/lib/redis'
import { computeSurfRating } from '@/app/lib/surf-rating'
import { getDirectionLabel, findCurrentHourIndex } from '@/app/lib/utils'
import type { EpicSpot, EpicNowData } from '@/app/lib/types'
import NOTABLE_SPOTS from '@/app/lib/notable-spots.json'

export const maxDuration = 300

const REDIS_KEY = 'epic-now'
const REDIS_TTL = 6 * 3600  // 6 hours

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

function val(arr: unknown[] | undefined, i: number): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : 0
}

async function checkSpot(spot: { name: string; lat: number; lon: number }): Promise<EpicSpot | null> {
  const base = `latitude=${spot.lat}&longitude=${spot.lon}`
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?${base}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
    `&timezone=auto&forecast_hours=4`
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?${base}` +
    `&hourly=wind_speed_10m&timezone=auto&forecast_hours=4&wind_speed_unit=kmh`
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, { signal: AbortSignal.timeout(8000) }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(8000) }),
    ])
    if (!marineRes.ok || !weatherRes.ok) return null
    const [marine, weather] = await Promise.all([marineRes.json(), weatherRes.json()])
    if (marine.error) return null

    const utcOffset = (marine.utc_offset_seconds ?? weather.utc_offset_seconds) ?? 0
    const idx = findCurrentHourIndex(weather.hourly.time as string[], utcOffset)
    const mh = marine.hourly as Record<string, unknown[]>
    const wh = weather.hourly as Record<string, unknown[]>

    const waveHeight  = val(mh.wave_height, idx)
    const wavePeriod  = val(mh.wave_period, idx)
    const swellHeight = val(mh.swell_wave_height, idx)
    const swellPeriod = val(mh.swell_wave_period, idx)
    const swellDir    = val(mh.swell_wave_direction, idx)
    const windSpeed   = val(wh.wind_speed_10m, idx)

    const rating = computeSurfRating(waveHeight, wavePeriod, swellHeight, swellPeriod, windSpeed)
    if (rating.label === 'FLAT' || rating.label === 'POOR') return null

    return {
      name:         spot.name,
      lat:          spot.lat,
      lon:          spot.lon,
      waveHeight,
      wavePeriod,
      swellDir,
      swellDirLabel: getDirectionLabel(swellDir),
      windSpeed,
      score:        rating.score,
      ratingLabel:  rating.label,
    }
  } catch {
    return null
  }
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = []
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const spots = NOTABLE_SPOTS as Array<{ name: string; lat: number; lon: number }>
  const tasks = spots.map(s => () => checkSpot(s))
  const results = await runWithConcurrency(tasks, 20)

  const topSpots = results
    .filter((s): s is EpicSpot => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  const data: EpicNowData = {
    spots: topSpots,
    updatedAt: new Date().toISOString(),
    checkedCount: spots.length,
  }

  await rset(REDIS_KEY, data, REDIS_TTL)

  return NextResponse.json({ ok: true, spotCount: topSpots.length, checkedCount: spots.length })
}

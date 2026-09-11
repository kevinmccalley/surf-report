import { NextRequest, NextResponse } from 'next/server'
import { rset } from '@/app/lib/redis'
import { computeSurfRating } from '@/app/lib/surf-rating'
import { findCalibration, applyCalibration } from '@/app/lib/spot-calibration'
import { getDirectionLabel, findCurrentHourIndex, omUrl } from '@/app/lib/utils'
import { getWorldSpots } from '@/app/lib/region-hull'
import type { SpotConditions, RegionConditionsSnapshot } from '@/app/lib/spot-conditions'

// Phase 8 — snapshot the current conditions for every break across every surf
// region, so the premium map layer can colour pins + show wave/wind without an
// N-fetch fan-out per page load. Deliberately a standalone 6-hourly cron rather
// than folded into /api/cron/epic-now: the two spot lists barely overlap (~1 of
// 178), so folding in wouldn't save any Open-Meteo calls, and 6h keeps the
// added ~1.4k calls/day comfortably inside the free tier. Going to 3h just
// means setting OPEN_METEO_API_KEY (omUrl already appends it) — no code change.

export const maxDuration = 300

const REDIS_KEY = 'region-conditions'
const REDIS_TTL = 12 * 3600 // 2× the refresh interval, so a skipped run doesn't blank it

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

function val(arr: unknown[] | undefined, i: number): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : 0
}

/**
 * Fetch + rate one location. Same pipeline as the epic-now cron's `checkSpot`,
 * minus the "drop anything below FAIR" filter — the map wants every break.
 * Returns null only on fetch/parse failure.
 */
async function rateLocation(lat: number, lon: number): Promise<SpotConditions | null> {
  const base = `latitude=${lat}&longitude=${lon}`
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?${base}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
    `&timezone=auto&forecast_hours=4`
  const ecmwfUrl = `${marineUrl}&models=ecmwf_wam`
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?${base}` +
    `&hourly=wind_speed_10m&timezone=auto&forecast_hours=4&wind_speed_unit=kmh`

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(omUrl(marineUrl), { signal: AbortSignal.timeout(8000) }),
      fetch(omUrl(weatherUrl), { signal: AbortSignal.timeout(8000) }),
    ])
    if (!marineRes.ok || !weatherRes.ok) return null
    const [marineRaw, weather] = await Promise.all([marineRes.json(), weatherRes.json()])

    // ECMWF fallback when NEMO is land-masked at this coordinate.
    let marine = marineRaw
    if (marine.error) {
      const r = await fetch(omUrl(ecmwfUrl), { signal: AbortSignal.timeout(8000) }).catch(() => null)
      if (!r?.ok) return null
      const fb = await r.json().catch(() => null)
      if (!fb || fb.error) return null
      marine = fb
    }

    const utcOffset = ((marine.utc_offset_seconds ?? weather.utc_offset_seconds) as number) ?? 0
    const idx = findCurrentHourIndex(weather.hourly.time as string[], utcOffset)
    const mh = marine.hourly as Record<string, unknown[]>
    const wh = weather.hourly as Record<string, unknown[]>

    const swellHeight = val(mh.swell_wave_height, idx)
    const swellPeriod = val(mh.swell_wave_period, idx)
    const swellDir = val(mh.swell_wave_direction, idx)
    const wavePeriod = val(mh.wave_period, idx)
    const windSpeed = val(wh.wind_speed_10m, idx)

    const rawRating = computeSurfRating(swellHeight, wavePeriod, swellHeight, swellPeriod, windSpeed)
    const cal = findCalibration(lat, lon)
    const rating = cal ? applyCalibration(rawRating, swellHeight, swellPeriod, swellDir, cal) : rawRating

    return {
      waveHeight: swellHeight,
      wavePeriod,
      swellDir,
      swellDirLabel: getDirectionLabel(swellDir),
      windSpeed,
      score: rating.score,
      ratingLabel: rating.label,
    }
  } catch {
    return null
  }
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
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

  const breaks = getWorldSpots()
  const results = await runWithConcurrency(
    breaks.map(b => () => rateLocation(b.lat, b.lon)),
    20,
  )

  const spots: Record<string, SpotConditions> = {}
  results.forEach((c, i) => {
    if (c) spots[breaks[i].slug] = c
  })

  const snapshot: RegionConditionsSnapshot = {
    spots,
    updatedAt: new Date().toISOString(),
    checkedCount: breaks.length,
  }
  await rset(REDIS_KEY, snapshot, REDIS_TTL)

  return NextResponse.json({
    ok: true,
    checkedCount: breaks.length,
    withData: Object.keys(spots).length,
  })
}

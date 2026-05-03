import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

// ── Direction helpers ─────────────────────────────────────────────────────────

const DIR_LABELS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

function directionLabel(deg: number): string {
  return DIR_LABELS[Math.round(deg / 22.5) % 16]
}

function circularMean(angles: number[]): number {
  if (!angles.length) return 0
  const sin = angles.reduce((s, a) => s + Math.sin(a * Math.PI / 180), 0)
  const cos = angles.reduce((s, a) => s + Math.cos(a * Math.PI / 180), 0)
  return (Math.atan2(sin, cos) * 180 / Math.PI + 360) % 360
}

// ── Data fetch ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

async function fetchMarineYear(lat: number, lon: number, year: number) {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction` +
    `&start_date=${year}-01-01&end_date=${year}-12-31`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const d = await res.json()
    const h = d.hourly ?? {}
    return {
      times:         (h.time                ?? []) as string[],
      waveHeight:    (h.wave_height         ?? []) as (number | null)[],
      wavePeriod:    (h.wave_period         ?? []) as (number | null)[],
      swellHeight:   (h.swell_wave_height   ?? []) as (number | null)[],
      swellPeriod:   (h.swell_wave_period   ?? []) as (number | null)[],
      swellDir:      (h.swell_wave_direction ?? []) as (number | null)[],
    }
  } catch { return null }
}

// ── Aggregation ───────────────────────────────────────────────────────────────

export interface ClimatologyMonth {
  month: number
  name: string
  avgHs: number
  avgPeriod: number
  avgSwellHeight: number
  avgSwellPeriod: number
  avgSwellDirection: number
  dominantDirectionLabel: string
  sampleSize: number
  score: number
}

async function computeClimatology(lat: number, lon: number): Promise<ClimatologyMonth[]> {
  // 2022–2024: three complete years with full Open-Meteo marine coverage
  const years = [2022, 2023, 2024]

  type Acc = { hs: number[]; period: number[]; sh: number[]; sp: number[]; sd: number[] }
  const monthly: Record<number, Acc> = {}
  for (let m = 1; m <= 12; m++) monthly[m] = { hs: [], period: [], sh: [], sp: [], sd: [] }

  const results = await Promise.all(years.map(y => fetchMarineYear(lat, lon, y)))

  for (const r of results) {
    if (!r) continue
    for (let i = 0; i < r.times.length; i++) {
      const m = parseInt(r.times[i].slice(5, 7))
      const acc = monthly[m]
      if (r.waveHeight[i]  != null) acc.hs.push(r.waveHeight[i]!)
      if (r.wavePeriod[i]  != null) acc.period.push(r.wavePeriod[i]!)
      if (r.swellHeight[i] != null) acc.sh.push(r.swellHeight[i]!)
      if (r.swellPeriod[i] != null) acc.sp.push(r.swellPeriod[i]!)
      if (r.swellDir[i]    != null) acc.sd.push(r.swellDir[i]!)
    }
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const m   = idx + 1
    const acc = monthly[m]
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    const avgHs          = avg(acc.hs)
    const avgSwellPeriod = avg(acc.sp)
    const avgSwellDir    = circularMean(acc.sd)

    // Score: quality swell = higher Hs + longer period, capped to avoid extremes dominating
    const score = Math.min(avgHs, 3.0) * 2 + Math.min(avgSwellPeriod, 14) * 0.3

    return {
      month:                  m,
      name:                   MONTH_NAMES[idx],
      avgHs:                  Math.round(avgHs * 100) / 100,
      avgPeriod:              Math.round(avg(acc.period) * 10) / 10,
      avgSwellHeight:         Math.round(avg(acc.sh) * 100) / 100,
      avgSwellPeriod:         Math.round(avgSwellPeriod * 10) / 10,
      avgSwellDirection:      Math.round(avgSwellDir),
      dominantDirectionLabel: directionLabel(avgSwellDir),
      sampleSize:             acc.hs.length,
      score:                  Math.round(score * 100) / 100,
    }
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const sp  = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  // Round to 0.5° — climatology doesn't need pin-point precision and this
  // dramatically improves cache hit rate for nearby searches.
  const latR = Math.round(lat * 2) / 2
  const lonR = Math.round(lon * 2) / 2

  const getCached = unstable_cache(
    () => computeClimatology(latR, lonR),
    [`climatology-${latR}-${lonR}`],
    { revalidate: 60 * 60 * 24 * 7 }  // recompute weekly
  )

  try {
    const months = await getCached()

    // Guard: if all sample sizes are 0 this is a land/gap location
    if (months.every(m => m.sampleSize === 0)) {
      return NextResponse.json({ available: false, reason: 'no_marine_data' })
    }

    const sorted     = [...months].sort((a, b) => b.score - a.score)
    const peakMonths = sorted.slice(0, 2).map(m => m.month).sort((a, b) => a - b)

    return NextResponse.json(
      { available: true, months, peakMonths, yearsUsed: [2022, 2023, 2024], lat: latR, lon: lonR },
      { headers: { 'Cache-Control': 's-maxage=604800, stale-while-revalidate=86400' } }
    )
  } catch {
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import type { DailyAccuracyRecord } from '@/app/api/accuracy-history/route'
import { omUrl } from '@/app/lib/utils'

// Call: GET /api/accuracy-backfill?month=2025-06
// Processes one calendar month at a time. Skips days already in KV.
// Requires Authorization: Bearer $CRON_SECRET header in production.

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

const STATIONS = [
  { name: 'Santa Monica',   stateAbbr: 'CA', stationId: '9410660', lat:  34.01, lon: -118.50 },
  { name: 'San Diego',      stateAbbr: 'CA', stationId: '9410170', lat:  32.65, lon: -117.40 },
  { name: 'Monterey',       stateAbbr: 'CA', stationId: '9413450', lat:  36.60, lon: -122.50 },
  { name: 'Crescent City',  stateAbbr: 'CA', stationId: '9419750', lat:  41.74, lon: -124.18 },
  { name: 'Newport',        stateAbbr: 'OR', stationId: '9435380', lat:  44.63, lon: -124.30 },
  { name: 'La Push',        stateAbbr: 'WA', stationId: '9441102', lat:  47.91, lon: -124.80 },
  { name: 'Duck',           stateAbbr: 'NC', stationId: '8651370', lat:  35.90, lon:  -75.30 },
  { name: 'Virginia Beach', stateAbbr: 'VA', stationId: '8638901', lat:  36.94, lon:  -75.70 },
  { name: 'Montauk',        stateAbbr: 'NY', stationId: '8510560', lat:  41.05, lon:  -72.00 },
  { name: 'Bar Harbor',     stateAbbr: 'ME', stationId: '8413320', lat:  44.39, lon:  -68.20 },
  { name: 'Miami Beach',    stateAbbr: 'FL', stationId: '8723170', lat:  25.77, lon:  -80.00 },
  { name: 'Galveston',      stateAbbr: 'TX', stationId: '8771341', lat:  29.00, lon:  -94.80 },
  { name: 'Hilo',           stateAbbr: 'HI', stationId: '1617760', lat:  19.65, lon: -154.90 },
  { name: 'Honolulu',       stateAbbr: 'HI', stationId: '1612340', lat:  21.31, lon: -157.90 },
  { name: 'Sitka',          stateAbbr: 'AK', stationId: '9451600', lat:  56.90, lon: -135.60 },
  { name: 'San Juan',       stateAbbr: 'PR', stationId: '9755371', lat:  18.47, lon:  -66.12 },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface NOAAPred { t: string; v: string; type: 'H' | 'L' }
interface TideExtreme { ms: number; height: number; type: 'High' | 'Low' }
interface Match { noaaMs: number; nemoMs: number; type: 'High' | 'Low'; errorMin: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMs(t: string): number {
  return new Date(t.replace(' ', 'T') + 'Z').getTime()
}

function interpolateMs(times: string[], heights: number[], i: number): number {
  const t1 = parseMs(times[i])
  const dt = t1 - parseMs(times[i - 1])
  const h0 = heights[i - 1], h1 = heights[i], h2 = heights[i + 1]
  const denom = h0 - 2 * h1 + h2
  if (denom === 0) return t1
  const frac = Math.max(-0.5, Math.min(0.5, (h0 - h2) / (2 * denom)))
  return t1 + frac * dt
}

function detectExtremes(times: string[], heights: number[]): TideExtreme[] {
  const out: TideExtreme[] = []
  for (let i = 1; i < heights.length - 1; i++) {
    const prev = heights[i - 1], cur = heights[i], next = heights[i + 1]
    if (cur > prev && cur >= next)
      out.push({ ms: interpolateMs(times, heights, i), height: cur, type: 'High' })
    else if (cur < prev && cur <= next)
      out.push({ ms: interpolateMs(times, heights, i), height: cur, type: 'Low' })
  }
  return out
}

function matchExtremes(noaa: NOAAPred[], nemo: TideExtreme[]): Match[] {
  return noaa.flatMap(n => {
    const noaaMs = parseMs(n.t)
    const type = n.type === 'H' ? 'High' : 'Low'
    const candidates = nemo.filter(e => e.type === type)
    if (!candidates.length) return []
    const best = candidates.reduce((a, b) =>
      Math.abs(a.ms - noaaMs) < Math.abs(b.ms - noaaMs) ? a : b
    )
    if (Math.abs(best.ms - noaaMs) > 6 * 3600000) return []
    return [{ noaaMs, nemoMs: best.ms, type, errorMin: Math.round((best.ms - noaaMs) / 60000) }]
  })
}

function daysInMonth(yearMonth: string): string[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) => {
    return `${yearMonth}-${String(i + 1).padStart(2, '0')}`
  })
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchNOAARange(stationId: string, from: string, to: string): Promise<NOAAPred[]> {
  const fmt = (d: string) => d.replace(/-/g, '')
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?begin_date=${fmt(from)}&end_date=${fmt(to)}` +
    `&station=${stationId}&product=predictions&datum=MLLW` +
    `&time_zone=gmt&units=metric&interval=hilo&application=groundswell&format=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return []
    const data = await res.json() as { predictions?: NOAAPred[]; error?: unknown }
    return data.error || !data.predictions ? [] : data.predictions
  } catch { return [] }
}

async function fetchNEMORange(
  lat: number, lon: number, from: string, to: string
): Promise<{ times: string[]; heights: number[] }> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl` +
    `&start_date=${from}&end_date=${to}`
  try {
    const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return { times: [], heights: [] }
    const data = await res.json() as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } }
    const rawTimes = data.hourly?.time ?? []
    const rawH = data.hourly?.sea_level_height_msl ?? []
    const times: string[] = []
    const heights: number[] = []
    for (let i = 0; i < rawTimes.length; i++) {
      if (rawH[i] !== null && rawH[i] !== undefined && !isNaN(rawH[i] as number)) {
        times.push(rawTimes[i])
        heights.push(rawH[i] as number)
      }
    }
    return { times, heights }
  } catch { return { times: [], heights: [] } }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV not configured — add KV_REST_API_URL and KV_REST_API_TOKEN env vars' }, { status: 503 })
  }

  const sp = req.nextUrl.searchParams
  let monthParam = sp.get('month') ?? ''
  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    monthParam = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const today = new Date().toISOString().slice(0, 10)
  const allDays = daysInMonth(monthParam)
  const validDays = allDays.filter(d => d < today)

  if (!validDays.length) {
    return NextResponse.json({ error: 'No historical days to backfill for this month', month: monthParam }, { status: 400 })
  }

  // Skip days already in KV
  const existing = await kv.mget<(DailyAccuracyRecord | null)[]>(...validDays.map(d => `accuracy:${d}`))
  const missingDays = validDays.filter((_, i) => !existing[i])

  if (!missingDays.length) {
    return NextResponse.json({
      month: monthParam, processed: 0, skipped: validDays.length,
      message: 'All days already stored in KV',
    })
  }

  const fromDate = validDays[0]
  const toDate   = validDays[validDays.length - 1]

  console.log(`[accuracy-backfill] ${monthParam}: ${missingDays.length} days to process (${validDays.length - missingDays.length} already in KV)`)

  // Fetch all station data for the month in parallel
  const stationData = await Promise.all(STATIONS.map(async s => {
    try {
      const [noaa, nemo] = await Promise.all([
        fetchNOAARange(s.stationId, fromDate, toDate),
        fetchNEMORange(s.lat, s.lon, fromDate, toDate),
      ])
      const extremes = detectExtremes(nemo.times, nemo.heights)
      return { station: s, noaa, extremes, ok: noaa.length > 0 && extremes.length > 0 }
    } catch {
      return { station: s, noaa: [] as NOAAPred[], extremes: [] as TideExtreme[], ok: false }
    }
  }))

  let processed = 0, failed = 0

  for (const day of missingDays) {
    try {
      const dayStartMs = new Date(day + 'T00:00:00Z').getTime()
      const dayEndMs   = new Date(day + 'T23:59:59Z').getTime()

      const stationResults = stationData.map(({ station, noaa, extremes, ok }) => {
        const base = { name: station.name, stateAbbr: station.stateAbbr, pctWithin30: 0, meanAbsError: 0, matches: [] as Match[] }

        if (!ok) return { ...base, error: 'Data unavailable' }

        const dayNoaa = noaa.filter(p => p.t.startsWith(day))
        if (!dayNoaa.length) return { ...base, error: 'No NOAA predictions' }

        // Use ±12 h window so extremes near midnight aren't dropped
        const dayExtremes = extremes.filter(e => e.ms >= dayStartMs - 12 * 3600000 && e.ms <= dayEndMs + 12 * 3600000)
        if (!dayExtremes.length) return { ...base, error: 'No NEMO extremes' }

        const matches = matchExtremes(dayNoaa, dayExtremes)
        if (!matches.length) return { ...base, error: 'No matched extremes' }

        const absErrors = matches.map(m => Math.abs(m.errorMin))
        const meanAbsError = Math.round(absErrors.reduce((a, b) => a + b, 0) / absErrors.length)
        const pctWithin30  = Math.round(absErrors.filter(e => e <= 30).length / absErrors.length * 100)
        return { ...base, pctWithin30, meanAbsError, matches }
      })

      const allMatches = stationResults.flatMap(r => r.matches)
      const overallPct = allMatches.length
        ? Math.round(allMatches.filter(m => Math.abs(m.errorMin) <= 30).length / allMatches.length * 100)
        : 0
      const avgError = allMatches.length
        ? Math.round(allMatches.reduce((a, m) => a + Math.abs(m.errorMin), 0) / allMatches.length)
        : 0

      const record: DailyAccuracyRecord = {
        date: day,
        timestamp: new Date().toISOString(),
        overallPct,
        totalMatches: allMatches.length,
        avgError,
        stationsChecked: stationResults.length,
        stationsPassing: stationResults.filter(r => r.pctWithin30 >= 50).length,
        stations: stationResults.map(({ name, stateAbbr, pctWithin30, meanAbsError, ...r }) => ({
          name, stateAbbr, pctWithin30, meanAbsError, error: (r as { error?: string }).error,
        })),
        waveAvgPctError: 0,
        wavesChecked: 0,
        wavesPassing: 0,
      }

      await kv.set(`accuracy:${day}`, record, { ex: 400 * 86400 })
      processed++
      console.log(`[accuracy-backfill] ${day}: ${overallPct}% (${allMatches.length} matches)`)
    } catch (err) {
      console.error(`[accuracy-backfill] ${day} failed:`, err)
      failed++
    }
  }

  return NextResponse.json({
    month: monthParam,
    processed,
    skipped: validDays.length - missingDays.length,
    failed,
    total: validDays.length,
    message: `To backfill all 12 months, call this route with ?month=YYYY-MM for each month from ${
      (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })()
    } through the current month.`,
  })
}

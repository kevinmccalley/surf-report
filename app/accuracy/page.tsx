import type { Metadata } from 'next'
import { kv } from '@vercel/kv'
import { auth, clerkClient } from '@clerk/nextjs/server'
import AccuracyPageContent from '@/app/components/AccuracyPageContent'
import type { AccuracyData, StationResult, HistAggregate } from '@/app/components/AccuracyPageContent'
import type { DailyAccuracyRecord } from '@/app/api/accuracy-history/route'
import { omUrl } from '@/app/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Forecast Accuracy — Groundswell',
  description: 'Surfline doesn\'t publish their accuracy numbers. We do — verified live against NOAA official harmonic predictions, updated every page load.',
  openGraph: {
    title: 'Forecast Accuracy — Groundswell',
    description: 'See exactly how accurate our tide predictions are vs. NOAA reference data. Live and transparent.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Forecast Accuracy — Groundswell' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface NOAAPred { t: string; v: string; type: 'H' | 'L' }
interface TideExtreme { ms: number; height: number; type: 'High' | 'Low' }
interface Match { noaaMs: number; nemoMs: number; type: 'High' | 'Low'; errorMin: number }

// ── Config ────────────────────────────────────────────────────────────────────

const STATIONS = [
  { name: 'Santa Monica',  stateAbbr: 'CA', stationId: '9410660', lat:  34.01, lon: -118.50 },
  { name: 'Duck',          stateAbbr: 'NC', stationId: '8651370', lat:  35.90, lon:  -75.30 },
  { name: 'Bar Harbor',    stateAbbr: 'ME', stationId: '8413320', lat:  44.39, lon:  -68.20 },
  { name: 'Crescent City', stateAbbr: 'CA', stationId: '9419750', lat:  41.74, lon: -124.18 },
  { name: 'Monterey',      stateAbbr: 'CA', stationId: '9413450', lat:  36.60, lon: -122.50 },
  { name: 'Hilo',          stateAbbr: 'HI', stationId: '1617760', lat:  19.65, lon: -154.90 },
]

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

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchNOAA(stationId: string): Promise<NOAAPred[]> {
  const now = new Date()
  const end = new Date(now.getTime() + 3 * 86400000)
  const p = (n: number) => String(n).padStart(2, '0')
  const yyyymmdd = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?begin_date=${yyyymmdd(now)}&end_date=${yyyymmdd(end)}` +
    `&station=${stationId}&product=predictions&datum=MLLW` +
    `&time_zone=gmt&units=metric&interval=hilo&application=groundswell&format=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json() as { predictions?: NOAAPred[]; error?: unknown }
    return data.error || !data.predictions ? [] : data.predictions
  } catch { return [] }
}

async function fetchNEMO(lat: number, lon: number): Promise<TideExtreme[]> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&forecast_days=5`
  try {
    const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const data = await res.json() as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } }
    const times  = data.hourly?.time ?? []
    const rawH   = data.hourly?.sea_level_height_msl ?? []
    const validT = times.filter((_, i) => rawH[i] !== null && rawH[i] !== undefined && !isNaN(rawH[i] as number))
    const validH = rawH.filter((h): h is number => h !== null && !isNaN(h))
    return detectExtremes(validT, validH)
  } catch { return [] }
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

async function computeStation(s: typeof STATIONS[0]): Promise<StationResult> {
  try {
    const [noaa, nemo] = await Promise.all([fetchNOAA(s.stationId), fetchNEMO(s.lat, s.lon)])
    if (!noaa.length || !nemo.length) {
      return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, errorKey: 'accuracy.errDataUnavailable' }
    }
    const matches = matchExtremes(noaa, nemo)
    if (!matches.length) {
      return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, errorKey: 'accuracy.errNoMatches' }
    }
    const absErrors = matches.map(m => Math.abs(m.errorMin))
    const meanAbsError = Math.round(absErrors.reduce((a, b) => a + b, 0) / absErrors.length)
    const pctWithin30 = Math.round(absErrors.filter(e => e <= 30).length / absErrors.length * 100)
    return { name: s.name, stateAbbr: s.stateAbbr, matches, meanAbsError, pctWithin30 }
  } catch {
    return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, errorKey: 'accuracy.errFetchFailed' }
  }
}

// ── Historical data from KV ───────────────────────────────────────────────────

async function fetchHistoricalRecords(days: number): Promise<DailyAccuracyRecord[]> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return []
  try {
    const today = new Date()
    const keys = Array.from({ length: days }, (_, i) => {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i)
      return `accuracy:${d.toISOString().slice(0, 10)}`
    })
    const raw = await kv.mget<DailyAccuracyRecord[]>(...keys)
    return raw
      .filter((r): r is DailyAccuracyRecord => r !== null && r !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch { return [] }
}

function computeHistoricalAggregate(records: DailyAccuracyRecord[]): HistAggregate | null {
  if (!records.length) return null
  const avgPct = Math.round(records.reduce((a, r) => a + r.overallPct, 0) / records.length)
  const totalMatches = records.reduce((a, r) => a + r.totalMatches, 0)
  const avgError = Math.round(records.reduce((a, r) => a + r.avgError, 0) / records.length)
  const earliest = records[0].date
  const latest   = records[records.length - 1].date

  const stationMap: Record<string, { name: string; stateAbbr: string; pcts: number[] }> = {}
  for (const rec of records) {
    for (const s of rec.stations) {
      if (s.error) continue
      const key = `${s.name},${s.stateAbbr}`
      if (!stationMap[key]) stationMap[key] = { name: s.name, stateAbbr: s.stateAbbr, pcts: [] }
      stationMap[key].pcts.push(s.pctWithin30)
    }
  }
  const stationAverages = Object.values(stationMap)
    .filter(s => s.pcts.length >= 3)
    .map(s => ({
      name: s.name, stateAbbr: s.stateAbbr,
      avgPct: Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length),
      samples: s.pcts.length,
    }))
    .sort((a, b) => b.avgPct - a.avgPct)

  const best  = stationAverages[0] ?? null
  const worst = stationAverages[stationAverages.length - 1] ?? null

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`
  }

  return { avgPct, totalMatches, avgError, fmtEarliest: fmtDate(earliest), fmtLatest: fmtDate(latest), days: records.length, best, worst }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getUserTier(): Promise<'free' | 'individual' | 'premium'> {
  try {
    const { userId } = await auth()
    if (!userId) return 'free'
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const meta = user.privateMetadata as { subscriptionStatus?: string; subscriptionTier?: string }
    const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    if (bypassEmails.length > 0 && bypassEmails.includes(userEmail)) return 'premium'
    if (meta.subscriptionStatus === 'active') {
      return meta.subscriptionTier === 'premium' ? 'premium' : 'individual'
    }
  } catch { /* treat as free */ }
  return 'free'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AccuracyPage() {
  const updatedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
  const tier = await getUserTier()

  const [results, historicalRecords] = await Promise.all([
    Promise.all(STATIONS.map(computeStation)),
    fetchHistoricalRecords(tier !== 'free' ? 365 : 7),
  ])

  const allMatches = results.flatMap(r => r.matches)
  const liveTotalExtremes = allMatches.length
  const liveStationsCount = results.filter(r => !r.errorKey).length
  const liveOverallPct = allMatches.length
    ? Math.round(allMatches.filter(m => Math.abs(m.errorMin) <= 30).length / allMatches.length * 100)
    : 0

  const hist = computeHistoricalAggregate(historicalRecords)
  const displayPct = hist ? hist.avgPct : liveOverallPct

  const data: AccuracyData = {
    updatedAt,
    results,
    historicalRecords,
    displayPct,
    liveTotalExtremes,
    liveStationsCount,
    hist,
    tier,
  }

  return <AccuracyPageContent data={data} />
}

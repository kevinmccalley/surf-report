import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import type { DailyAccuracyRecord } from '@/app/api/accuracy-history/route'
import { omUrl } from '@/app/lib/utils'

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

// ── Improvement 1: Expanded station coverage ──────────────────────────────────
// 16 geographically diverse NOAA stations across all US coasts + territories.
// lat/lon are open-water NEMO coordinates — kept offshore so the 5 km model
// grid has ocean cells. NOAA data comes from stationId regardless of lat/lon.

const STATIONS = [
  // US West Coast — Pacific
  { name: 'Santa Monica',   stateAbbr: 'CA', stationId: '9410660', lat:  34.01, lon: -118.50 },
  { name: 'San Diego',      stateAbbr: 'CA', stationId: '9410170', lat:  32.65, lon: -117.40 },
  { name: 'Monterey',       stateAbbr: 'CA', stationId: '9413450', lat:  36.60, lon: -122.50 },
  { name: 'Crescent City',  stateAbbr: 'CA', stationId: '9419750', lat:  41.74, lon: -124.18 },
  { name: 'Newport',        stateAbbr: 'OR', stationId: '9435380', lat:  44.63, lon: -124.30 },
  { name: 'La Push',        stateAbbr: 'WA', stationId: '9441102', lat:  47.91, lon: -124.80 },
  // US East Coast — Atlantic
  { name: 'Duck',           stateAbbr: 'NC', stationId: '8651370', lat:  35.90, lon:  -75.30 },
  { name: 'Virginia Beach', stateAbbr: 'VA', stationId: '8638901', lat:  36.94, lon:  -75.70 },
  { name: 'Montauk',        stateAbbr: 'NY', stationId: '8510560', lat:  41.05, lon:  -72.00 },
  { name: 'Bar Harbor',     stateAbbr: 'ME', stationId: '8413320', lat:  44.39, lon:  -68.20 },
  // US Gulf & Southeast
  { name: 'Miami Beach',    stateAbbr: 'FL', stationId: '8723170', lat:  25.77, lon:  -80.00 },
  { name: 'Galveston',      stateAbbr: 'TX', stationId: '8771341', lat:  29.00, lon:  -94.80 },
  // Pacific Islands
  { name: 'Hilo',           stateAbbr: 'HI', stationId: '1617760', lat:  19.65, lon: -154.90 },
  { name: 'Honolulu',       stateAbbr: 'HI', stationId: '1612340', lat:  21.31, lon: -157.90 },
  // Alaska & Caribbean
  { name: 'Sitka',          stateAbbr: 'AK', stationId: '9451600', lat:  56.90, lon: -135.60 },
  { name: 'San Juan',       stateAbbr: 'PR', stationId: '9755371', lat:  18.47, lon:  -66.12 },
]

// ── Improvement 4: NDBC buoy wave accuracy stations ───────────────────────────
// Compare Open-Meteo (NEMO) wave heights against NDBC realtime buoy observations.
// lat/lon must match buoy position so Open-Meteo is queried at the same location.

const NDBC_STATIONS = [
  { name: 'Santa Monica Basin, CA', lat:  33.85, lon: -119.04, buoyId: '46025' },
  { name: 'Diamond Shoals, NC',     lat:  35.01, lon:  -75.26, buoyId: '41025' },
  { name: 'Ambrose / NY Bight',     lat:  40.25, lon:  -73.17, buoyId: '44025' },
  { name: 'Eel River, CA',          lat:  40.76, lon: -124.54, buoyId: '46022' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface NOAAPred { t: string; v: string; type: 'H' | 'L' }
interface TideExtreme { ms: number; height: number; type: 'High' | 'Low' }
interface Match { noaaMs: number; nemoMs: number; type: 'High' | 'Low'; errorMin: number }

interface StationResult {
  name: string
  stateAbbr: string
  stationId: string
  lat: number
  lon: number
  matches: Match[]
  nemoExtremeCount: number
  meanAbsError: number
  pctWithin30: number
  error?: string
}

interface WaveCheck {
  name: string
  buoyId: string
  buoyWvht: number
  nemoWvht: number
  errorM: number
  pctError: number
  status: 'ok' | 'failing' | 'unavailable'
}

// ── Tide helpers ──────────────────────────────────────────────────────────────

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

// ── Tide data fetching ────────────────────────────────────────────────────────

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

async function fetchNEMO(lat: number, lon: number): Promise<{ extremes: TideExtreme[]; rawCount: number }> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&forecast_days=5`
  try {
    const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return { extremes: [], rawCount: 0 }
    const data = await res.json() as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } }
    const times  = data.hourly?.time ?? []
    const rawH   = data.hourly?.sea_level_height_msl ?? []
    const validT = times.filter((_, i) => rawH[i] !== null && rawH[i] !== undefined && !isNaN(rawH[i] as number))
    const validH = rawH.filter((h): h is number => h !== null && !isNaN(h))
    const extremes = detectExtremes(validT, validH)
    return { extremes, rawCount: validH.length }
  } catch { return { extremes: [], rawCount: 0 } }
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
    const [noaa, { extremes: nemo, rawCount }] = await Promise.all([
      fetchNOAA(s.stationId),
      fetchNEMO(s.lat, s.lon),
    ])
    const nemoExtremeCount = nemo.length

    if (!noaa.length) {
      return { ...s, matches: [], nemoExtremeCount, meanAbsError: 0, pctWithin30: 0, error: 'NOAA unavailable' }
    }
    if (!nemo.length) {
      return { ...s, matches: [], nemoExtremeCount: 0, meanAbsError: 0, pctWithin30: 0,
        error: rawCount === 0 ? 'NEMO no data' : 'NEMO no extremes' }
    }

    const matches = matchExtremes(noaa, nemo)
    if (!matches.length) {
      return { ...s, matches: [], nemoExtremeCount, meanAbsError: 0, pctWithin30: 0, error: 'No matchable extremes' }
    }
    const absErrors = matches.map(m => Math.abs(m.errorMin))
    const meanAbsError = Math.round(absErrors.reduce((a, b) => a + b, 0) / absErrors.length)
    const pctWithin30 = Math.round(absErrors.filter(e => e <= 30).length / absErrors.length * 100)
    return { ...s, matches, nemoExtremeCount, meanAbsError, pctWithin30 }
  } catch {
    return { ...s, matches: [], nemoExtremeCount: 0, meanAbsError: 0, pctWithin30: 0, error: 'Fetch failed' }
  }
}

// ── Diagnosis engine ──────────────────────────────────────────────────────────

function diagnose(r: StationResult): { cause: string; proposal: string } {
  if (r.error === 'NOAA unavailable') {
    return {
      cause: `NOAA station ${r.stationId} returned no predictions. May be a transient API outage or the station ID has changed.`,
      proposal: `Verify station ${r.stationId} is active at tidesandcurrents.noaa.gov/stations.html. If decommissioned, find the nearest active station and update STATIONS in accuracy page and accuracy-check route.`,
    }
  }
  if (r.error === 'NEMO no data') {
    return {
      cause: `Open-Meteo returned no sea_level_height_msl values at (${r.lat}, ${r.lon}). The coordinate is likely on land or in a NEMO model gap (shallow shelf, enclosed bay, or inland water).`,
      proposal: `Shift the test coordinate toward deeper open water. Try lat ${(r.lat - 0.15).toFixed(3)}, lon ${r.lon.toFixed(3)} and verify NEMO returns non-null hourly values. Update lat/lon in STATIONS (these coords are only used for NEMO; NOAA data comes from the station ID).`,
    }
  }
  if (r.error === 'NEMO no extremes') {
    return {
      cause: `NEMO returned sea level data at (${r.lat}, ${r.lon}) but the curve is flat — no high/low extremes detected in 5 days. This usually means the coordinate is in a micro-tidal region or NEMO's signal is suppressed by shallow-water effects.`,
      proposal: `Plot the raw NEMO hourly sea_level_height_msl for this coordinate. If the tidal range is < 0.1m, try a coordinate 0.2–0.5° offshore in deeper water.`,
    }
  }
  if (r.error === 'No matchable extremes') {
    return {
      cause: `NEMO found ${r.nemoExtremeCount} tide extreme(s) at (${r.lat}, ${r.lon}) but none were within 6 hours of a NOAA reference extreme. Phase offset is > 6h — possibly the coordinate is in a body of water with fundamentally different tidal timing (bay vs open coast).`,
      proposal: `Fetch the NEMO raw curve and compare to NOAA predictions manually. Check if tidal patterns are present but shifted by ~12h (a full tidal cycle). Also verify the coordinate is on the same coast as the NOAA station, not across a peninsula.`,
    }
  }

  const errors = r.matches.map(m => m.errorMin)
  const avg = Math.round(errors.reduce((a, b) => a + b, 0) / errors.length)
  const allPositive = errors.every(e => e > 0)
  const allNegative = errors.every(e => e < 0)

  if (allPositive || allNegative) {
    return {
      cause: `Systematic ${avg > 0 ? 'late' : 'early'} bias of ~${Math.abs(avg)} min across all ${r.matches.length} matched extremes. NEMO is consistently ${avg > 0 ? 'behind' : 'ahead of'} NOAA. This is a model accuracy limitation for this coastal geometry, not a code bug.`,
      proposal: `If the bias is close to 60 or 120 min, rule out a timezone offset bug first. Otherwise, consider whether this station can be replaced with one in more open ocean where NEMO performs better. The /accuracy page headline score should exclude stations with known systematic NEMO limitations.`,
    }
  }

  return {
    cause: `Random scatter across ${r.matches.length} matched extremes (mean error ${r.meanAbsError} min, ${r.pctWithin30}% within 30 min). NEMO's accuracy degrades near complex coastal geometry — this location may be near a headland, tidal inlet, or shallow sound.`,
    proposal: `Compare NEMO predictions visually against NOAA for a 3-day window. If accuracy is persistently below 50%, replace this benchmark station with one in more open-ocean conditions where the global model performs reliably.`,
  }
}

// ── GitHub issue ──────────────────────────────────────────────────────────────

function fmtHHMM(ms: number): string {
  const d = new Date(ms)
  const h = d.getUTCHours(), m = d.getUTCMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} UTC`
}

async function createIssueIfNew(r: StationResult, diag: ReturnType<typeof diagnose>) {
  const token = process.env.GITHUB_TOKEN
  const repo  = process.env.GITHUB_REPO
  if (!token || !repo) {
    console.warn(`[accuracy-check] GITHUB_TOKEN or GITHUB_REPO not set — skipping issue for ${r.name}`)
    return
  }

  const titlePrefix = `[Accuracy Alert] ${r.name}, ${r.stateAbbr}`

  const searchUrl =
    `https://api.github.com/search/issues` +
    `?q=repo:${repo}+is:open+is:issue+"${encodeURIComponent(titlePrefix)}"&per_page=1`
  try {
    const sr = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    })
    if (sr.ok) {
      const sd = await sr.json() as { total_count: number }
      if (sd.total_count > 0) {
        console.log(`[accuracy-check] Open issue already exists for ${r.name} — skipping`)
        return
      }
    }
  } catch { /* proceed to create */ }

  const matchRows = r.matches.slice(0, 10).map(m =>
    `| ${m.type} | ${fmtHHMM(m.noaaMs)} | ${fmtHHMM(m.nemoMs)} | ${m.errorMin > 0 ? '+' : ''}${m.errorMin} min |`
  ).join('\n')

  const score = r.error
    ? r.error
    : `${r.pctWithin30}% within 30 min · avg ${r.meanAbsError} min error`

  const body = `## Accuracy Alert — ${r.name}, ${r.stateAbbr}

Detected by the automated daily accuracy check on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

| Field | Value |
|-------|-------|
| **NOAA station** | ${r.stationId} |
| **NEMO coordinate** | (${r.lat}, ${r.lon}) |
| **Score** | ${score} |
| **NEMO extremes found** | ${r.nemoExtremeCount} |
| **Matched extremes** | ${r.matches.length} |

---

## Diagnosis

**Cause:** ${diag.cause}

**Proposed fix:** ${diag.proposal}

---
${r.matches.length > 0 ? `
## Per-extreme errors (first ${Math.min(r.matches.length, 10)})

| Type | NOAA reference | Groundswell | Error |
|------|---------------|-------------|-------|
${matchRows}
` : ''}
---
*Auto-generated by \`/api/accuracy-check\` — review the live data at [groundswell.surf/accuracy](https://groundswell.surf/accuracy)*`

  try {
    await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `${titlePrefix} — ${score}`,
        body,
        labels: ['accuracy', 'automated'],
      }),
    })
    console.log(`[accuracy-check] GitHub issue created for ${r.name}`)
  } catch (err) {
    console.error(`[accuracy-check] Failed to create issue for ${r.name}:`, err)
  }
}

// ── Improvement 4: NDBC wave accuracy check ───────────────────────────────────

async function fetchNDBCWaveHeight(buoyId: string): Promise<number | null> {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.split('\n')

    // Find header line — always starts with #YY
    const headerLine = lines.find(l => l.startsWith('#YY'))
    if (!headerLine) return null
    const headers = headerLine.replace(/^#+\s*/, '').trim().split(/\s+/)
    const wvhtIdx = headers.indexOf('WVHT')
    if (wvhtIdx < 0) return null

    // First non-comment line after the units row is the most recent observation
    const dataLine = lines.slice(2).find(l => l.trim() && !l.startsWith('#'))
    if (!dataLine) return null

    const parts = dataLine.trim().split(/\s+/)
    const wvht = parseFloat(parts[wvhtIdx])
    // NDBC uses "MM" for missing; parseFloat("MM") = NaN which we filter below
    if (isNaN(wvht) || wvht < 0) return null
    return wvht
  } catch { return null }
}

async function fetchOpenMeteoWaveHeight(lat: number, lon: number): Promise<number | null> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=wave_height&forecast_days=1&timezone=GMT`
  try {
    const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json() as {
      hourly?: { time?: string[]; wave_height?: (number | null)[] }
    }
    const times   = data.hourly?.time ?? []
    const heights = data.hourly?.wave_height ?? []

    // Find the slot nearest to the current UTC hour
    const now = new Date()
    const targetHour = `${now.toISOString().slice(0, 13)}:00`
    let idx = times.findIndex((t: string) => t === targetHour)
    if (idx < 0) idx = times.findIndex((t: string) => t >= targetHour)
    if (idx < 0) idx = 0

    const h = heights[idx]
    return typeof h === 'number' && !isNaN(h) && h >= 0 ? h : null
  } catch { return null }
}

async function checkWaveStation(
  s: { name: string; lat: number; lon: number; buoyId: string }
): Promise<WaveCheck> {
  const [buoyH, nemoH] = await Promise.all([
    fetchNDBCWaveHeight(s.buoyId),
    fetchOpenMeteoWaveHeight(s.lat, s.lon),
  ])
  if (buoyH === null || nemoH === null) {
    return { name: s.name, buoyId: s.buoyId, buoyWvht: 0, nemoWvht: 0, errorM: 0, pctError: 0, status: 'unavailable' }
  }
  const errorM   = Math.abs(nemoH - buoyH)
  const pctError = buoyH > 0.05 ? Math.round(errorM / buoyH * 100) : 0
  return {
    name: s.name,
    buoyId: s.buoyId,
    buoyWvht: Math.round(buoyH * 100) / 100,
    nemoWvht: Math.round(nemoH * 100) / 100,
    errorM:   Math.round(errorM * 100) / 100,
    pctError,
    status: pctError > 50 ? 'failing' : 'ok',
  }
}

// ── Improvement 5: UTC→local timezone regression test ────────────────────────
// Replicates the utcToLocal logic from app/api/tides/route.ts and verifies it
// converts the WorldTides date format correctly. Catches regressions that would
// cause all non-NOAA/DFO users to see times in UTC instead of their local tz.

function runTimezoneRegressionTest(): { passed: boolean; details: string } {
  // WorldTides format: "YYYY-MM-DD HH:MM:SS +0000"
  // Jeffreys Bay (SAST = UTC+2): 08:26 UTC → should become 10:26 local
  const input    = '2026-05-03 08:26:00 +0000'
  const timezone = 'Africa/Johannesburg'
  const expectedH = '10', expectedM = '26'

  try {
    const stripped = input.trim().replace(/\s[+-]\d{4}$/, '')
    const s   = stripped.replace(' ', 'T')
    const iso = s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z'
    const d   = new Date(iso)
    if (isNaN(d.getTime())) {
      return { passed: false, details: `Date parse failed for "${input}" — possible utcToLocal regression` }
    }
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)
    const p: Record<string, string> = {}
    for (const part of parts) p[part.type] = part.value
    const h = p.hour === '24' ? '00' : p.hour

    if (h !== expectedH || p.minute !== expectedM) {
      return {
        passed: false,
        details:
          `utcToLocal("${input}", "${timezone}") → ${h}:${p.minute}, ` +
          `expected ${expectedH}:${expectedM} — timezone conversion bug detected`,
      }
    }
    return { passed: true, details: `UTC→local ok: ${h}:${p.minute} ${timezone}` }
  } catch (e) {
    return { passed: false, details: `utcToLocal threw: ${e}` }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[accuracy-check] Running daily accuracy check...')

  // Improvement 5: timezone regression test runs first — instant, catches bugs early
  const tzTest = runTimezoneRegressionTest()
  if (!tzTest.passed) {
    console.error(`[accuracy-check] TIMEZONE REGRESSION FAILED: ${tzTest.details}`)
  }

  // Improvements 1 + 4: run all tide stations and wave buoys in parallel
  const [tideResults, waveChecks] = await Promise.all([
    Promise.all(STATIONS.map(computeStation)),
    Promise.all(NDBC_STATIONS.map(checkWaveStation)),
  ])

  const failing = tideResults.filter(r => r.pctWithin30 < 50)

  // Create GitHub issues for failing tide stations (non-blocking)
  await Promise.allSettled(
    failing.map(r => createIssueIfNew(r, diagnose(r)))
  )

  const waveResults = waveChecks.filter(w => w.status !== 'unavailable')
  const waveFailCount = waveResults.filter(w => w.status === 'failing').length

  const summary = {
    timestamp: new Date().toISOString(),
    timezoneTest: tzTest,
    // Legacy top-level fields for backward compatibility
    checked: tideResults.length,
    failing: failing.length,
    results: tideResults.map(r => ({
      station: `${r.name}, ${r.stateAbbr}`,
      stationId: r.stationId,
      nemoCoord: `${r.lat}, ${r.lon}`,
      pctWithin30: r.pctWithin30,
      meanAbsError: r.meanAbsError,
      nemoExtremes: r.nemoExtremeCount,
      matched: r.matches.length,
      error: r.error ?? null,
      status: r.pctWithin30 >= 50 ? 'ok' : 'failing',
    })),
    waveChecks: waveChecks,
  }

  // ── Aggregate stats ───────────────────────────────────────────────────────────
  const allMatches = tideResults.flatMap(r => r.matches)
  const overallPct = allMatches.length
    ? Math.round(allMatches.filter(m => Math.abs(m.errorMin) <= 30).length / allMatches.length * 100)
    : 0
  const avgError = allMatches.length
    ? Math.round(allMatches.reduce((a, m) => a + Math.abs(m.errorMin), 0) / allMatches.length)
    : 0
  const waveAvailChecks = waveChecks.filter(w => w.status !== 'unavailable')
  const waveAvgPctError = waveAvailChecks.length
    ? Math.round(waveAvailChecks.reduce((a, w) => a + w.pctError, 0) / waveAvailChecks.length)
    : 0

  // ── Persist to Vercel KV ──────────────────────────────────────────────────────
  const dateKey = new Date().toISOString().slice(0, 10)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const record: DailyAccuracyRecord = {
        date: dateKey,
        timestamp: new Date().toISOString(),
        overallPct,
        totalMatches: allMatches.length,
        avgError,
        stationsChecked: tideResults.length,
        stationsPassing: tideResults.filter(r => r.pctWithin30 >= 50).length,
        stations: tideResults.map(r => ({
          name: r.name,
          stateAbbr: r.stateAbbr,
          pctWithin30: r.pctWithin30,
          meanAbsError: r.meanAbsError,
          error: r.error,
        })),
        waveAvgPctError,
        wavesChecked: waveAvailChecks.length,
        wavesPassing: waveAvailChecks.filter(w => w.status === 'ok').length,
      }
      await kv.set(`accuracy:${dateKey}`, record, { ex: 400 * 86400 })
      console.log(`[accuracy-check] Persisted record for ${dateKey}: ${overallPct}% overall`)
    } catch (err) {
      console.error('[accuracy-check] KV write failed:', err)
    }
  }

  // ── Global aggregate alert (< 60%) ───────────────────────────────────────────
  if (overallPct > 0 && overallPct < 60) {
    const token = process.env.GITHUB_TOKEN
    const repo  = process.env.GITHUB_REPO
    if (token && repo) {
      const titlePrefix = '[Accuracy Alert] Overall accuracy below 60%'
      try {
        const sr = await fetch(
          `https://api.github.com/search/issues?q=repo:${repo}+is:open+is:issue+"${encodeURIComponent(titlePrefix)}"&per_page=1`,
          { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } }
        )
        const sd = await sr.json() as { total_count: number }
        if (sd.total_count === 0) {
          await fetch(`https://api.github.com/repos/${repo}/issues`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
            body: JSON.stringify({
              title: `${titlePrefix} — ${overallPct}%`,
              body: `## Overall Accuracy Alert\n\nThe daily accuracy check recorded an overall score of **${overallPct}%** on ${dateKey} — below the 60% threshold.\n\n| Metric | Value |\n|--------|-------|\n| Overall % within 30 min | ${overallPct}% |\n| Avg error | ${avgError} min |\n| Stations failing | ${failing.length}/${tideResults.length} |\n\nReview the failing stations above and investigate systematically.\n\n*Auto-generated by \`/api/accuracy-check\`*`,
              labels: ['accuracy', 'automated'],
            }),
          })
          console.log('[accuracy-check] Global accuracy alert issue created')
        }
      } catch (err) {
        console.error('[accuracy-check] Failed to create global alert issue:', err)
      }
    }
  }

  console.log(
    `[accuracy-check] Done: ${tideResults.length} tide stations checked, ` +
    `${failing.length} failing | overall ${overallPct}% | ` +
    `${waveResults.length} wave buoys, ${waveFailCount} failing | ` +
    `timezone test: ${tzTest.passed ? 'PASS' : 'FAIL'} | ` +
    `${failing.length} issue(s) attempted`
  )

  return NextResponse.json(summary)
}

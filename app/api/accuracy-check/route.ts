import { NextRequest, NextResponse } from 'next/server'

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

// ── Station config (mirrors accuracy page) ────────────────────────────────────
// Note: lat/lon used for Open-Meteo NEMO only — keep in open water near the
// NOAA station so NEMO's ~5 km grid has ocean cells to model.

const STATIONS = [
  { name: 'Santa Monica',  stateAbbr: 'CA', stationId: '9410660', lat:  34.01,  lon: -118.50  },
  { name: 'Duck',          stateAbbr: 'NC', stationId: '8651370', lat:  35.90,  lon:  -75.30  },
  { name: 'Bar Harbor',    stateAbbr: 'ME', stationId: '8413320', lat:  44.39,  lon:  -68.20  },
  { name: 'Crescent City', stateAbbr: 'CA', stationId: '9419750', lat:  41.74,  lon: -124.18  },
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

async function fetchNEMO(lat: number, lon: number): Promise<{ extremes: TideExtreme[]; rawCount: number }> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&forecast_days=5`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
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

  // Has matches but pctWithin30 < 50
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
  const repo  = process.env.GITHUB_REPO  // e.g. "kevinmccalley/surf-report"
  if (!token || !repo) {
    console.warn(`[accuracy-check] GITHUB_TOKEN or GITHUB_REPO not set — skipping issue for ${r.name}`)
    return
  }

  const titlePrefix = `[Accuracy Alert] ${r.name}, ${r.stateAbbr}`

  // Avoid duplicate open issues for the same station
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[accuracy-check] Running daily accuracy check...')

  const results = await Promise.all(STATIONS.map(computeStation))
  const failing = results.filter(r => r.pctWithin30 < 50)

  // Create GitHub issues for failing stations (errors are non-fatal)
  await Promise.allSettled(
    failing.map(r => createIssueIfNew(r, diagnose(r)))
  )

  const summary = {
    timestamp: new Date().toISOString(),
    checked: results.length,
    failing: failing.length,
    results: results.map(r => ({
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
  }

  console.log(
    `[accuracy-check] Done: ${summary.checked} stations checked, ` +
    `${summary.failing} failing, ${failing.length} issue(s) attempted`
  )

  return NextResponse.json(summary)
}

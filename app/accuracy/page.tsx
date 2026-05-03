import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Forecast Accuracy | Groundswell',
  description: 'Surfline doesn\'t publish their accuracy numbers. We do — verified live against NOAA official harmonic predictions, updated every page load.',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface NOAAPred {
  t: string   // "YYYY-MM-DD HH:MM" in UTC/GMT
  v: string   // height in meters
  type: 'H' | 'L'
}

interface TideExtreme {
  ms: number  // UTC milliseconds (parabolic interpolated)
  height: number
  type: 'High' | 'Low'
}

interface Match {
  noaaMs: number
  nemoMs: number
  type: 'High' | 'Low'
  errorMin: number
}

interface StationResult {
  name: string
  stateAbbr: string
  matches: Match[]
  meanAbsError: number
  pctWithin30: number
  error?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATIONS = [
  { name: 'Santa Monica', stateAbbr: 'CA', stationId: '9410660', lat:  34.01, lon: -118.50 },
  { name: 'Duck',          stateAbbr: 'NC', stationId: '8651370', lat:  35.90,  lon: -75.30  },
  { name: 'Bar Harbor',    stateAbbr: 'ME', stationId: '8413320', lat:  44.39, lon:  -68.20 },
  { name: 'Crescent City', stateAbbr: 'CA', stationId: '9419750', lat:  41.74, lon: -124.18 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMs(t: string): number {
  return new Date(t.replace(' ', 'T') + 'Z').getTime()
}

function fmtHHMM(ms: number): string {
  const d = new Date(ms)
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// Parabolic interpolation — same algorithm as app/api/tides/route.ts
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
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const data = await res.json() as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } }
    const times   = data.hourly?.time ?? []
    const rawH    = data.hourly?.sea_level_height_msl ?? []
    const validT  = times.filter((_, i) => rawH[i] !== null && rawH[i] !== undefined && !isNaN(rawH[i] as number))
    const validH  = rawH.filter((h): h is number => h !== null && !isNaN(h))
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
      return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, error: 'Data unavailable' }
    }
    const matches = matchExtremes(noaa, nemo)
    if (!matches.length) {
      return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, error: 'No matchable extremes' }
    }
    const absErrors = matches.map(m => Math.abs(m.errorMin))
    const meanAbsError = Math.round(absErrors.reduce((a, b) => a + b, 0) / absErrors.length)
    const pctWithin30 = Math.round(absErrors.filter(e => e <= 30).length / absErrors.length * 100)
    return { name: s.name, stateAbbr: s.stateAbbr, matches, meanAbsError, pctWithin30 }
  } catch {
    return { name: s.name, stateAbbr: s.stateAbbr, matches: [], meanAbsError: 0, pctWithin30: 0, error: 'Fetch failed' }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorDot({ min }: { min: number }) {
  const abs = Math.abs(min)
  const color = abs <= 15 ? '#2dd4bf' : abs <= 30 ? '#a3e635' : abs <= 60 ? '#fbbf24' : '#f87171'
  const sign = min > 0 ? '+' : ''
  return (
    <span style={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '3.5rem', display: 'inline-block', textAlign: 'right' }}>
      {sign}{min} min
    </span>
  )
}

function WaveLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AccuracyPage() {
  const updatedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'

  const results = await Promise.all(STATIONS.map(computeStation))

  const allMatches = results.flatMap(r => r.matches)
  const overallPct = allMatches.length
    ? Math.round(allMatches.filter(m => Math.abs(m.errorMin) <= 30).length / allMatches.length * 100)
    : 0
  const avgError = allMatches.length
    ? Math.round(allMatches.reduce((a, m) => a + Math.abs(m.errorMin), 0) / allMatches.length)
    : 0
  const totalExtremes = allMatches.length

  return (
    <div className="theme-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 theme-header">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">Groundswell</span>
          </Link>
          <span className="text-slate-700 select-none">/</span>
          <span className="text-sm text-slate-400">Forecast Accuracy</span>
          <span className="ml-auto text-xs text-slate-600">Updated {updatedAt}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8 pb-24 space-y-5">

        {/* Headline */}
        <div className="py-2">
          <p className="text-sm font-medium text-slate-400 mb-4">
            Surfline doesn&apos;t publish their accuracy numbers. We do.
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            <span className="text-teal-400">{overallPct}%</span>
            <span className="text-slate-300"> of tide predictions</span>
            <br />
            <span className="text-slate-300">within 30 minutes</span>
          </h1>
          <p className="text-slate-500 mt-4 text-sm max-w-lg leading-relaxed">
            30 minutes is the difference between catching the right session and missing it.
            Verified live against NOAA&apos;s official harmonic predictions —{' '}
            <span className="text-slate-300 font-medium">{totalExtremes} tide extremes</span>
            {' '}across {results.filter(r => !r.error).length} open-coast US stations.
            Updated each page load. No stored results, no cherry-picking.
          </p>
        </div>

        {/* Station cards */}
        {results.map(station => (
          <section key={station.name} className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-0.5">
                  NOAA Tide Station
                </p>
                <h2 className="text-white font-semibold">
                  {station.name}, {station.stateAbbr}
                </h2>
              </div>
              {station.error ? (
                <span className="shrink-0 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                  Unavailable
                </span>
              ) : (
                <div className="text-right shrink-0">
                  <span className="text-3xl font-bold text-teal-400">{station.pctWithin30}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">within 30 min · avg {station.meanAbsError} min</p>
                </div>
              )}
            </div>

            {station.error ? (
              <p className="text-sm text-slate-600 italic">{station.error}</p>
            ) : (
              <div className="space-y-1">
                {/* Column headers */}
                <div className="grid gap-2 px-3 pb-1" style={{ gridTemplateColumns: '3rem 1fr 1fr auto' }}>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">Type</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">NOAA reference</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">Groundswell</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700 text-right">Error</span>
                </div>

                {station.matches.slice(0, 9).map((m, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      gridTemplateColumns: '3rem 1fr 1fr auto',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.045)',
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: m.type === 'High' ? '#2dd4bf' : '#94a3b8' }}>
                      {m.type === 'High' ? 'High' : 'Low'}
                    </span>
                    <span className="text-xs text-slate-300 tabular-nums">{fmtHHMM(m.noaaMs)}</span>
                    <span className="text-xs text-slate-300 tabular-nums">{fmtHHMM(m.nemoMs)}</span>
                    <ErrorDot min={m.errorMin} />
                  </div>
                ))}

                {station.matches.length > 9 && (
                  <p className="text-xs text-slate-700 px-3 pt-1">
                    +{station.matches.length - 9} more extremes compared
                  </p>
                )}
              </div>
            )}
          </section>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 text-xs text-slate-600">
          <span><span className="font-semibold text-teal-400">≤ 15 min</span> — Excellent</span>
          <span><span className="font-semibold" style={{ color: '#a3e635' }}>16–30 min</span> — Good</span>
          <span><span className="font-semibold text-amber-400">31–60 min</span> — Acceptable</span>
          <span><span className="font-semibold text-red-400">&gt; 60 min</span> — Investigate</span>
          <span className="ml-auto">All times UTC</span>
        </div>

        {/* Methodology */}
        <section className="glass-card rounded-2xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            How we measure this
          </h2>
          <div className="space-y-3.5 text-sm text-slate-500 leading-relaxed">
            <p>
              <span className="text-slate-200 font-medium">Reference:</span>{' '}
              NOAA&apos;s official harmonic tide predictions — the same data used by the US Coast Guard,
              NOAA Weather, and commercial mariners. Derived from decades of measured tidal observations
              at each station.
            </p>
            <p>
              <span className="text-slate-200 font-medium">Our model:</span>{' '}
              Open-Meteo&apos;s NEMO global tidal model — a physics-based ocean circulation model with
              full-earth coverage, including every surf break that Surfline doesn&apos;t reach.
              Sub-hour timing is resolved via parabolic interpolation of the hourly model output.
            </p>
            <p>
              <span className="text-slate-200 font-medium">The match:</span>{' '}
              For each NOAA predicted high or low tide, we find the nearest Groundswell prediction of
              the same type and measure the timing difference in minutes. 30 minutes is the meaningful
              threshold — the difference between catching the right window and missing it.
            </p>
            <p>
              <span className="text-slate-200 font-medium">Weekly monitoring:</span>{' '}
              An automated check runs every Monday comparing predictions against 8 global locations
              across 4 ocean basins. Any anomaly triggers an immediate alert.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7dd3fc' }}
          >
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            Check your break →
          </Link>
        </div>

      </main>
    </div>
  )
}

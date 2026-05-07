import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import baseline from '@/app/lib/monitor-baseline.json'
import { omUrl } from '@/app/lib/utils'

// ── Auth ──────────────────────────────────────────────────────────────────────
// Vercel cron sends Authorization: Bearer {CRON_SECRET}
// Also allow manual trigger in dev
function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

// ── Checks ────────────────────────────────────────────────────────────────────

interface Finding {
  source: string
  severity: 'critical' | 'notable' | 'info'
  title: string
  detail: string
  proposal: string
  effort: string
}

async function checkOpenMeteo(): Promise<Finding[]> {
  const findings: Finding[] = []
  try {
    const url =
      'https://marine-api.open-meteo.com/v1/marine' +
      '?latitude=34.0&longitude=-118.5' +
      '&hourly=wave_height,swell_wave_height,wind_wave_height,sea_level_height_msl' +
      '&forecast_days=1&timezone=auto'
    const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(10000) })

    if (!res.ok) {
      findings.push({
        source: 'Open-Meteo Marine API',
        severity: 'critical',
        title: 'Marine API is returning errors',
        detail: `HTTP ${res.status} — the wave and tide data endpoint is not responding correctly.`,
        proposal: 'Investigate immediately. Check status.open-meteo.com and their GitHub for announcements.',
        effort: '< 1 hour',
      })
      return findings
    }

    const data = await res.json() as {
      hourly?: Record<string, unknown[]>
      error?: boolean
      reason?: string
    }

    if (data.error) {
      findings.push({
        source: 'Open-Meteo Marine API',
        severity: 'critical',
        title: 'Marine API returned an error response',
        detail: data.reason ?? 'Unknown error from the API.',
        proposal: 'Check the API for variable name changes or deprecations.',
        effort: '1–2 hours',
      })
      return findings
    }

    const hourly = data.hourly ?? {}

    // Check critical variables still exist
    const criticalVars: Record<string, keyof typeof baseline.openMeteo> = {
      wave_height:          'hasWaveHeight',
      sea_level_height_msl: 'hasSealevelVariable',
      swell_wave_height:    'hasSwellHeight',
    }

    for (const [varName, baselineKey] of Object.entries(criticalVars)) {
      const nowPresent = varName in hourly && Array.isArray(hourly[varName])
      const wasPresent = baseline.openMeteo[baselineKey]
      if (wasPresent && !nowPresent) {
        findings.push({
          source: 'Open-Meteo Marine API',
          severity: 'critical',
          title: `Variable "${varName}" has disappeared`,
          detail: `This was previously available and is used by Groundswell for ${varName === 'sea_level_height_msl' ? 'global tide estimation' : 'wave data'}. It is no longer in the API response.`,
          proposal: `Find the replacement variable in the Open-Meteo docs and update the relevant API route.`,
          effort: '2–4 hours',
        })
      }
      if (!wasPresent && nowPresent) {
        findings.push({
          source: 'Open-Meteo Marine API',
          severity: 'info',
          title: `Variable "${varName}" is now available`,
          detail: 'This variable was not previously in the baseline. It may be a new addition worth evaluating.',
          proposal: 'Review the variable and consider integrating it if it improves forecast quality.',
          effort: '1–2 hours',
        })
      }
    }

    // Check for new interesting marine variables
    const knownVars = new Set([
      'wave_height','wave_direction','wave_period',
      'swell_wave_height','swell_wave_direction','swell_wave_period',
      'wind_wave_height','wind_wave_direction','wind_wave_period',
      'sea_surface_temperature','sea_level_height_msl',
      'ocean_current_velocity','ocean_current_direction',
    ])
    const newVars = Object.keys(hourly).filter(v => !knownVars.has(v))
    if (newVars.length > 0) {
      findings.push({
        source: 'Open-Meteo Marine API',
        severity: 'notable',
        title: `${newVars.length} new marine variable(s) detected`,
        detail: `New variables not in baseline: ${newVars.join(', ')}.`,
        proposal: 'Review each variable in the Open-Meteo docs and evaluate for integration.',
        effort: '1–3 hours',
      })
    }

  } catch {
    findings.push({
      source: 'Open-Meteo Marine API',
      severity: 'critical',
      title: 'Marine API is unreachable',
      detail: 'The request timed out or failed with a network error.',
      proposal: 'Check status.open-meteo.com. If it is a prolonged outage, post a status note.',
      effort: '< 1 hour',
    })
  }
  return findings
}

async function checkNOAA(): Promise<Finding[]> {
  const findings: Finding[] = []
  try {
    const res = await fetch(
      'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions',
      { signal: AbortSignal.timeout(12000) }
    )
    if (!res.ok) {
      findings.push({
        source: 'NOAA CO-OPS',
        severity: 'critical',
        title: 'NOAA station list endpoint is down',
        detail: `HTTP ${res.status}. US tide predictions will not work until this is restored.`,
        proposal: 'Monitor tidesandcurrents.noaa.gov/api_v2/ for announcements. Ensure Open-Meteo fallback is still functioning.',
        effort: '< 1 hour to investigate',
      })
      return findings
    }
    const data = await res.json() as { stations?: unknown[] }
    const count = data.stations?.length ?? 0
    const bucket = Math.round(count / 500) * 500

    if (!baseline.noaa.alive) {
      findings.push({
        source: 'NOAA CO-OPS',
        severity: 'notable',
        title: 'NOAA API has come back online',
        detail: `NOAA was previously unreachable. It is now responding with ${count} stations.`,
        proposal: 'Verify tide data is returning correctly for US locations.',
        effort: '< 30 min',
      })
    }

    if (Math.abs(bucket - baseline.noaa.stationCountBucket) > 500) {
      findings.push({
        source: 'NOAA CO-OPS',
        severity: 'notable',
        title: `Station count changed significantly (${baseline.noaa.stationCountBucket} → ${bucket})`,
        detail: `The station list previously had ~${baseline.noaa.stationCountBucket} entries, now has ~${count}. This could indicate new coverage or a data structure change.`,
        proposal: 'Verify nearest-station lookups still work correctly for US locations. Check if new regions are covered.',
        effort: '1 hour',
      })
    }
  } catch {
    findings.push({
      source: 'NOAA CO-OPS',
      severity: 'critical',
      title: 'NOAA API is unreachable',
      detail: 'Request timed out. US tide predictions are not functioning.',
      proposal: 'Check tidesandcurrents.noaa.gov for status. Open-Meteo global model will serve as fallback.',
      effort: '< 1 hour to investigate',
    })
  }
  return findings
}

async function checkDFO(): Promise<Finding[]> {
  const findings: Finding[] = []
  try {
    const res = await fetch(
      'https://api-sine.dfo-mpo.gc.ca/api/v1/stations',
      { signal: AbortSignal.timeout(12000) }
    )
    if (!res.ok) {
      findings.push({
        source: 'DFO IWLS (Canada)',
        severity: 'critical',
        title: 'DFO station endpoint is down',
        detail: `HTTP ${res.status}. Canadian tide predictions will fall back to Open-Meteo global model.`,
        proposal: 'Check api-sine.dfo-mpo.gc.ca for maintenance notices.',
        effort: '< 1 hour',
      })
      return findings
    }
    const data = await res.json() as unknown[]
    if (!Array.isArray(data)) {
      findings.push({
        source: 'DFO IWLS (Canada)',
        severity: 'critical',
        title: 'DFO response format has changed',
        detail: 'The station list no longer returns a JSON array. The response structure may have changed.',
        proposal: 'Check the DFO IWLS API docs for breaking changes and update the tides route accordingly.',
        effort: '2–4 hours',
      })
      return findings
    }
    const bucket = Math.round(data.length / 100) * 100
    if (Math.abs(bucket - baseline.dfo.stationCountBucket) > 200) {
      findings.push({
        source: 'DFO IWLS (Canada)',
        severity: 'notable',
        title: `DFO station count changed (${baseline.dfo.stationCountBucket} → ${bucket})`,
        detail: `Station count was ~${baseline.dfo.stationCountBucket}, now ~${data.length}.`,
        proposal: 'Verify Canadian tide lookups still work. New stations could mean better coverage.',
        effort: '< 1 hour',
      })
    }
  } catch {
    findings.push({
      source: 'DFO IWLS (Canada)',
      severity: 'notable',
      title: 'DFO API is unreachable',
      detail: 'Request timed out. Canadian locations will use Open-Meteo global tidal model as fallback.',
      proposal: 'Monitor for recovery. Not critical as the global fallback covers Canada adequately.',
      effort: '< 30 min',
    })
  }
  return findings
}

async function checkNpmPackage(pkg: string, displayName: string): Promise<Finding | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json() as { version?: string }
    const latestVersion = data.version
    if (!latestVersion) return null

    const latestMajor = parseInt(latestVersion.split('.')[0], 10)
    const baselinePkg = baseline.packages[pkg as keyof typeof baseline.packages]
    const baselineMajor = baselinePkg?.major ?? 0
    const baselineLatest = baselinePkg?.latest ?? ''

    if (latestMajor > baselineMajor) {
      return {
        source: `npm · ${displayName}`,
        severity: 'notable',
        title: `${displayName} has a new major version: v${latestVersion}`,
        detail: `Currently on v${baselineLatest} (major ${baselineMajor}). A new major version (${latestMajor}) is available. Major versions typically include breaking changes.`,
        proposal: `Review the ${displayName} migration guide. If the upgrade is straightforward, update dependencies and test thoroughly.`,
        effort: '2–8 hours depending on breaking changes',
      }
    }

    if (latestVersion !== baselineLatest) {
      return {
        source: `npm · ${displayName}`,
        severity: 'info',
        title: `${displayName} minor/patch update: ${baselineLatest} → ${latestVersion}`,
        detail: 'A non-breaking update is available.',
        proposal: 'Run npm update and verify the build passes. Usually safe to apply.',
        effort: '< 30 min',
      }
    }

    return null
  } catch {
    return null
  }
}

async function checkPackages(): Promise<Finding[]> {
  const results = await Promise.all([
    checkNpmPackage('next',        'Next.js'),
    checkNpmPackage('recharts',    'Recharts'),
    checkNpmPackage('tailwindcss', 'Tailwind CSS'),
    checkNpmPackage('@clerk/nextjs','Clerk'),
    checkNpmPackage('stripe',      'Stripe SDK'),
  ])
  return results.filter(Boolean) as Finding[]
}

// ── Global tide accuracy ──────────────────────────────────────────────────────

interface TideExtremeSample { time: string; height: number; type: 'High' | 'Low' }

const TIDE_TEST_LOCATIONS = [
  { name: 'Santa Monica, CA',           lat:  34.01, lon: -118.50, tz: 'America/Los_Angeles', noaaStation: '9410660' },
  { name: 'Galway, Ireland',             lat:  53.27, lon:   -9.07, tz: 'Europe/Dublin',       noaaStation: null      },
  { name: 'Dakar, Senegal',              lat:  14.69, lon:  -17.45, tz: 'Africa/Dakar',        noaaStation: null      },
  { name: 'San Juan del Sur, Nicaragua', lat:  11.25, lon:  -85.88, tz: 'America/Managua',     noaaStation: null      },
  { name: 'Apia, Samoa',                 lat: -13.85, lon: -171.75, tz: 'Pacific/Apia',        noaaStation: null      },
  { name: 'Colombo, Sri Lanka',          lat:   6.93, lon:   79.85, tz: 'Asia/Colombo',        noaaStation: null      },
  { name: 'Kushimoto, Japan',             lat:  33.47, lon:  135.78, tz: 'Asia/Tokyo',          noaaStation: null      },
  { name: 'Port Elizabeth, S. Africa',   lat: -33.97, lon:   25.60, tz: 'Africa/Johannesburg', noaaStation: null      },
]

function detectMonitorExtremes(times: string[], heights: number[]): TideExtremeSample[] {
  const out: TideExtremeSample[] = []
  for (let i = 1; i < heights.length - 1; i++) {
    const prev = heights[i - 1], cur = heights[i], next = heights[i + 1]
    if (cur > prev && cur >= next) out.push({ time: times[i], height: cur, type: 'High' })
    else if (cur < prev && cur <= next) out.push({ time: times[i], height: cur, type: 'Low' })
  }
  return out
}

async function checkTideAccuracy(): Promise<Finding[]> {
  const findings: Finding[] = []

  // Fetch Open-Meteo tide heights for all test locations in parallel
  const results = await Promise.all(
    TIDE_TEST_LOCATIONS.map(async loc => {
      try {
        const url =
          `https://marine-api.open-meteo.com/v1/marine` +
          `?latitude=${loc.lat}&longitude=${loc.lon}` +
          `&hourly=sea_level_height_msl&forecast_days=5`
        const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(12000) })
        if (!res.ok) return { loc, extremes: null as TideExtremeSample[] | null }
        const data = await res.json() as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } }
        const times   = data.hourly?.time ?? []
        const rawH    = data.hourly?.sea_level_height_msl ?? []
        const validT  = times.filter((_, i) => rawH[i] !== null && rawH[i] !== undefined && !isNaN(rawH[i] as number))
        const validH  = rawH.filter((h): h is number => h !== null && !isNaN(h))
        if (!validT.length) return { loc, extremes: null as TideExtremeSample[] | null }
        return { loc, extremes: detectMonitorExtremes(validT, validH), validH }
      } catch {
        return { loc, extremes: null as TideExtremeSample[] | null }
      }
    })
  )

  for (const r of results) {
    if (!r.extremes) continue // Open-Meteo reachability already reported by checkOpenMeteo

    const { loc, extremes } = r
    const source = `Tide Accuracy · ${loc.name}`

    // 1. Enough extremes in 5 days? (semi-diurnal ≈ 20; expect at least 6)
    if (extremes.length < 4) {
      findings.push({
        source,
        severity: 'critical',
        title: `Only ${extremes.length} tide extreme(s) detected in 5 days at ${loc.name}`,
        detail: `Expected ≥ 8 hi/lo extremes over 5 days. Getting ${extremes.length} means the extreme detection algorithm is failing or NEMO has no meaningful tidal signal here.`,
        proposal: 'Inspect raw Open-Meteo sea_level_height_msl for this coordinate. Check tryOpenMeteo() extreme detection in app/api/tides/route.ts.',
        effort: '1–3 hours',
      })
      continue
    }

    // 2. Alternating H/L pattern?
    let dupIdx = -1
    for (let i = 0; i < Math.min(extremes.length - 1, 10); i++) {
      if (extremes[i].type === extremes[i + 1].type) { dupIdx = i; break }
    }
    if (dupIdx >= 0) {
      findings.push({
        source,
        severity: 'critical',
        title: `Consecutive ${extremes[dupIdx].type} tides at ${loc.name} — H/L pattern broken`,
        detail: `Extremes at index ${dupIdx} and ${dupIdx + 1} are both "${extremes[dupIdx].type}". A plateau wider than 2 hours may be creating duplicate detections.`,
        proposal: 'Review the plateau detection fix (cur > prev && cur >= next) in tryOpenMeteo. A 3+-point flat top may still produce duplicates.',
        effort: '1–2 hours',
      })
    }

    // 3. Any gap > 18h between consecutive extremes? (missed extreme)
    for (let i = 0; i < extremes.length - 1; i++) {
      const ms1 = new Date(extremes[i].time + 'Z').getTime()
      const ms2 = new Date(extremes[i + 1].time + 'Z').getTime()
      const hrs = (ms2 - ms1) / 3_600_000
      if (hrs > 18) {
        findings.push({
          source,
          severity: 'notable',
          title: `${hrs.toFixed(1)}-hour gap between tide extremes at ${loc.name} — likely missed extreme`,
          detail: `From ${extremes[i].time} (${extremes[i].type}) to ${extremes[i + 1].time} (${extremes[i + 1].type}) is ${hrs.toFixed(1)}h. Even diurnal locations should not exceed 16h. A wide gap usually means a plateau peak was skipped.`,
          proposal: 'Fetch 3 days of raw Open-Meteo hourly data for this location and inspect the gap period. The plateau fix handles 2-point ties; check for wider flat spots.',
          effort: '1–2 hours',
        })
        break
      }
    }

    // 4. Tidal range sanity (open-ocean coastal should be > 0.15m)
    const highs = extremes.filter(e => e.type === 'High').map(e => e.height)
    const lows  = extremes.filter(e => e.type === 'Low').map(e => e.height)
    if (highs.length && lows.length) {
      const range = Math.max(...highs) - Math.min(...lows)
      if (range < 0.15) {
        findings.push({
          source,
          severity: 'notable',
          title: `Near-zero tidal range at ${loc.name} (${range.toFixed(2)}m)`,
          detail: `Detected range is only ${range.toFixed(2)}m. This is below the minimum expected for an open-ocean coastal location and may indicate poor NEMO coverage or an off-shore coordinate placement.`,
          proposal: 'Verify coordinates are on the coastline. If the location is in an enclosed sea (Mediterranean, Persian Gulf), near-zero range is normal. Otherwise investigate NEMO data quality for this region.',
          effort: '< 1 hour',
        })
      }
    }
  }

  // NOAA timing accuracy: cross-check Santa Monica hilo predictions (in GMT for direct UTC comparison)
  try {
    const now = new Date()
    const end = new Date(now.getTime() + 3 * 86400000)
    const yyyymmdd = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const noaaUrl =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${yyyymmdd(now)}&end_date=${yyyymmdd(end)}` +
      `&station=9410660&product=predictions&datum=MLLW&time_zone=gmt` +
      `&units=metric&interval=hilo&application=groundswell&format=json`
    const nr = await fetch(noaaUrl, { signal: AbortSignal.timeout(10000) })
    if (nr.ok) {
      const nd = await nr.json() as { error?: unknown; predictions?: { t: string; v: string; type: string }[] }
      if (!nd.error && nd.predictions) {
        const preds = nd.predictions
        let patternOk = true
        for (let i = 0; i < Math.min(preds.length - 1, 8); i++) {
          if (preds[i].type === preds[i + 1].type) { patternOk = false; break }
        }
        if (preds.length < 4 || !patternOk) {
          findings.push({
            source: 'Tide Accuracy · NOAA Station 9410660 (Santa Monica)',
            severity: 'notable',
            title: 'NOAA hilo predictions for Santa Monica look malformed',
            detail: `Got ${preds.length} predictions${!patternOk ? ' with broken H/L alternation' : ''}. Expected ≥ 4 alternating entries.`,
            proposal: 'Check NOAA API directly for station 9410660. May be a temporary data gap.',
            effort: '< 1 hour',
          })
        }

        // Quantitative NEMO vs NOAA timing comparison
        const toMs = (t: string) => new Date(t.replace(' ', 'T') + 'Z').getTime()
        const smNemo = results.find(r => r.loc.name === 'Santa Monica, CA')
        if (smNemo?.extremes && smNemo.extremes.length >= 4) {
          const absErrors: number[] = []
          for (const pred of preds) {
            const predMs = toMs(pred.t)
            const predType = pred.type === 'H' ? 'High' : 'Low'
            const candidates = smNemo.extremes.filter(e => e.type === predType)
            if (!candidates.length) continue
            const nearest = candidates.reduce((a, b) =>
              Math.abs(toMs(a.time) - predMs) < Math.abs(toMs(b.time) - predMs) ? a : b
            )
            const diff = Math.abs(toMs(nearest.time) - predMs)
            if (diff <= 6 * 3600000) absErrors.push(diff / 60000)
          }
          if (absErrors.length >= 4) {
            const avgErr = Math.round(absErrors.reduce((a, b) => a + b, 0) / absErrors.length)
            if (avgErr > 150) {
              findings.push({
                source: 'Tide Accuracy · NOAA vs NEMO (Santa Monica)',
                severity: 'critical',
                title: `NEMO tide timing severely off at Santa Monica — avg ${avgErr} min error`,
                detail: `Compared ${absErrors.length} NEMO extremes against NOAA hilo predictions: average absolute error is ${avgErr} min. Normal range is 10–40 min. Values above 150 min indicate a model failure or algorithm regression.`,
                proposal: 'Visit /accuracy to see the full breakdown. Check Open-Meteo NEMO data directly for this coordinate. Review whether a recent code change affected extreme detection.',
                effort: '1–2 hours',
              })
            } else if (avgErr > 90) {
              findings.push({
                source: 'Tide Accuracy · NOAA vs NEMO (Santa Monica)',
                severity: 'notable',
                title: `NEMO tide timing elevated at Santa Monica — avg ${avgErr} min error`,
                detail: `Average absolute timing error vs NOAA: ${avgErr} min across ${absErrors.length} extremes. Normal range is 10–40 min. Values above 90 min warrant investigation.`,
                proposal: 'Visit /accuracy to see per-extreme breakdown. Cross-check Santa Monica predictions against tide-forecast.com. If timing has shifted, check whether Open-Meteo updated their NEMO model.',
                effort: '< 1 hour',
              })
            }
          }
        }
      }
    }
  } catch { /* NOAA reachability covered by checkNOAA */ }

  // Quarterly manual spot-check reminder (Jan, Apr, Jul, Oct)
  if ([0, 3, 6, 9].includes(new Date().getMonth())) {
    findings.push({
      source: 'Tide Accuracy · Quarterly Reminder',
      severity: 'info',
      title: 'Quarterly manual tide & surf accuracy spot-check due',
      detail: 'Time to verify Groundswell\'s tide times and wave data against Surfline and surf-forecast.com for a global sample. Previous spot-checks have caught: timezone display errors (Hossegor, France), NOAA cooperative station fallback failures (San Clemente, CA), and plateau detection bugs (Madeira, Samoa, Barbados, Sardinia).',
      proposal: 'Ask Claude to run a worldwide accuracy analysis covering ~10 locations: West Coast US, East Coast US, Hawaii, Atlantic Europe, Mediterranean, West Africa, Indian Ocean, East Asia, South Pacific, Caribbean, Central America Pacific. For each, compare tide times against tide-forecast.com (< 90 min = good, > 2 hours = investigate). Also compare wave height direction against Surfline or surf-forecast.com for 4–5 known surf spots. Reply GO to trigger this.',
      effort: '2–3 hours',
    })
  }

  return findings
}

// ── Global wave data accuracy ─────────────────────────────────────────────────

const WAVE_TEST_LOCATIONS = [
  { name: 'Pipeline, Hawaii',         lat:  21.66, lon: -158.05 },
  { name: 'Hossegor, France',         lat:  43.69, lon:    1.42 },
  { name: 'Snapper Rocks, Australia', lat: -28.17, lon:  153.55 },
  { name: 'Jeffreys Bay, S. Africa',  lat: -34.05, lon:   24.92 },
]

async function checkWaveAccuracy(): Promise<Finding[]> {
  const findings: Finding[] = []

  const results = await Promise.all(
    WAVE_TEST_LOCATIONS.map(async loc => {
      try {
        const url =
          `https://marine-api.open-meteo.com/v1/marine` +
          `?latitude=${loc.lat}&longitude=${loc.lon}` +
          `&hourly=wave_height,swell_wave_height&forecast_days=3`
        const res = await fetch(omUrl(url), { signal: AbortSignal.timeout(10000) })
        if (!res.ok) return { loc, ok: false, allZero: false, allNull: false, maxH: 0 }
        const data = await res.json() as { hourly?: { wave_height?: (number | null)[] } }
        const wh = (data.hourly?.wave_height ?? []).filter((h): h is number => h !== null && !isNaN(h))
        return {
          loc, ok: true,
          allNull: wh.length === 0,
          allZero: wh.length > 0 && wh.every(h => h === 0),
          maxH:    wh.length ? Math.max(...wh) : 0,
        }
      } catch {
        return { loc, ok: false, allZero: false, allNull: false, maxH: 0 }
      }
    })
  )

  for (const r of results) {
    if (!r.ok) continue
    if (r.allNull || r.allZero) {
      findings.push({
        source: `Wave Data · ${r.loc.name}`,
        severity: 'critical',
        title: `Wave height is ${r.allNull ? 'null/missing' : 'zero'} for 72 hours at ${r.loc.name}`,
        detail: `All wave_height values are ${r.allNull ? 'absent' : '0.0 m'} for the next 72 hours at this known open-ocean surf spot. This strongly suggests the Open-Meteo marine model has lost coverage for this coordinate or the location is resolving as inland.`,
        proposal: 'Fetch Open-Meteo marine API directly for this coordinate and inspect the raw response. Verify the coordinate is in the ocean. If a model outage, check status.open-meteo.com.',
        effort: '1–2 hours',
      })
    } else if (r.maxH > 15) {
      findings.push({
        source: `Wave Data · ${r.loc.name}`,
        severity: 'notable',
        title: `Extreme wave forecast at ${r.loc.name}: ${r.maxH.toFixed(1)} m in next 72 hours`,
        detail: `Open-Meteo is forecasting ${r.maxH.toFixed(1)} m waves. Values above 15 m are rare and may indicate a model data spike rather than a genuine event.`,
        proposal: 'Cross-check against Surfline or Windguru for this location and date range. If it matches a real storm, no action needed. If spurious, note it for the next Open-Meteo data quality report.',
        effort: '< 30 min to verify',
      })
    }
  }

  return findings
}

// ── Email ─────────────────────────────────────────────────────────────────────

function severityEmoji(s: Finding['severity']): string {
  return s === 'critical' ? '🔴' : s === 'notable' ? '🟡' : 'ℹ️'
}

async function sendAlert(findings: Finding[]) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[monitor] Email credentials not set — skipping email send')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const notableCount  = findings.filter(f => f.severity === 'notable').length
  const subjectTag = criticalCount > 0 ? '🔴 Action needed' : notableCount > 0 ? '🟡 Updates available' : 'ℹ️ FYI'

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #020917 0%, #0d2040 100%); padding: 28px 32px;">
    <p style="color: #38bdf8; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px 0;">Groundswell · Weekly Monitor</p>
    <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0;">${subjectTag}</h1>
    <p style="color: #64748b; font-size: 13px; margin: 8px 0 0 0;">
      ${findings.length} item${findings.length !== 1 ? 's' : ''} detected · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>

  <!-- Findings -->
  <div style="padding: 24px 32px;">
    <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">
      Hi Kevin — the weekly Groundswell data source check found the following. Reply <strong>GO</strong> to approve any implementation work, or ignore to skip this cycle.
    </p>

    ${findings.map(f => `
    <div style="border: 1px solid ${f.severity === 'critical' ? '#fecaca' : f.severity === 'notable' ? '#fef08a' : '#e2e8f0'}; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; background: ${f.severity === 'critical' ? '#fff5f5' : f.severity === 'notable' ? '#fefce8' : '#f8fafc'};">
      <p style="font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">${severityEmoji(f.severity)} ${f.source}</p>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${f.title}</h3>
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px 0; line-height: 1.5;">${f.detail}</p>
      <div style="background: rgba(14,165,233,0.06); border-left: 3px solid #0ea5e9; padding: 10px 14px; border-radius: 0 6px 6px 0;">
        <p style="font-size: 13px; color: #0369a1; font-weight: 600; margin: 0 0 2px 0;">Claude's proposal</p>
        <p style="font-size: 13px; color: #0f172a; margin: 0;">${f.proposal}</p>
        <p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0;">Estimated effort: ${f.effort}</p>
      </div>
    </div>
    `).join('')}

    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 8px;">
      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">
        Reply <strong>GO</strong> to this email and I'll implement the changes described above. If you want only specific items done, name them. Ignore this email to skip the cycle — the next check runs in 7 days.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0 0;">
        Groundswell Monitor · <a href="https://groundswell.surf" style="color: #0ea5e9;">groundswell.surf</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`

  await transporter.sendMail({
    from: `"Groundswell Monitor" <${process.env.GMAIL_USER}>`,
    to: 'kevinmccalley@gmail.com',
    subject: `[Groundswell Monitor] ${subjectTag} — ${findings.length} item${findings.length !== 1 ? 's' : ''} found`,
    html: htmlBody,
  })
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[monitor] Starting weekly check...')

  const [openMeteoFindings, noaaFindings, dfoFindings, packageFindings, tideAccuracyFindings, waveAccuracyFindings] = await Promise.all([
    checkOpenMeteo(),
    checkNOAA(),
    checkDFO(),
    checkPackages(),
    checkTideAccuracy(),
    checkWaveAccuracy(),
  ])

  const allFindings = [
    ...openMeteoFindings,
    ...noaaFindings,
    ...dfoFindings,
    ...packageFindings,
    ...tideAccuracyFindings,
    ...waveAccuracyFindings,
  ]

  const summary = {
    timestamp: new Date().toISOString(),
    total: allFindings.length,
    critical: allFindings.filter(f => f.severity === 'critical').length,
    notable:  allFindings.filter(f => f.severity === 'notable').length,
    info:     allFindings.filter(f => f.severity === 'info').length,
    findings: allFindings,
  }

  console.log(`[monitor] Check complete: ${summary.total} findings (${summary.critical} critical, ${summary.notable} notable, ${summary.info} info)`)

  if (allFindings.length > 0) {
    try {
      await sendAlert(allFindings)
      console.log('[monitor] Alert email sent to kevinmccalley@gmail.com')
    } catch (err) {
      console.error('[monitor] Failed to send email:', err)
    }
  } else {
    console.log('[monitor] All systems nominal — no email sent')
  }

  return NextResponse.json(summary)
}

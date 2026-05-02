import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import baseline from '@/app/lib/monitor-baseline.json'

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
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })

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
        Groundswell Monitor · <a href="https://surf-report-chi.vercel.app" style="color: #0ea5e9;">surf-report-chi.vercel.app</a>
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

  const [openMeteoFindings, noaaFindings, dfoFindings, packageFindings] = await Promise.all([
    checkOpenMeteo(),
    checkNOAA(),
    checkDFO(),
    checkPackages(),
  ])

  const allFindings = [
    ...openMeteoFindings,
    ...noaaFindings,
    ...dfoFindings,
    ...packageFindings,
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

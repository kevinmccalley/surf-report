import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { rget } from '@/app/lib/redis'
import { triggerEvent } from '@/app/lib/loops'
import type { EpicNowData, SavedLocation } from '@/app/lib/types'

export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

async function getSpotData(lat: number, lon: number): Promise<{ height: number; period: number }> {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,wave_period&forecast_days=1&timezone=UTC`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (data.error || !data.hourly?.wave_height) return { height: 0, period: 0 }
    const nowHour = new Date().getUTCHours()
    return {
      height: data.hourly.wave_height[nowHour] ?? data.hourly.wave_height[0] ?? 0,
      period: data.hourly.wave_period?.[nowHour] ?? data.hourly.wave_period?.[0] ?? 0,
    }
  } catch {
    return { height: 0, period: 0 }
  }
}

function fmtWaves(height: number, period: number): string {
  const h = height > 0 ? `${height.toFixed(1)}m` : ''
  const p = period > 0 ? `${Math.round(period)}s` : ''
  return [h, p].filter(Boolean).join(', ')
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const epicData = await rget<EpicNowData>('epic-now')
  const top3 = epicData?.spots?.slice(0, 3) ?? []

  if (top3.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no epic spots today' })
  }

  const globalProps: Record<string, string | number> = {
    spot1Name:   top3[0]?.name ?? '',
    spot1Waves:  top3[0] ? fmtWaves(top3[0].waveHeight, top3[0].wavePeriod) : '',
    spot2Name:   top3[1]?.name ?? '',
    spot2Waves:  top3[1] ? fmtWaves(top3[1].waveHeight, top3[1].wavePeriod) : '',
    spot3Name:   top3[2]?.name ?? '',
    spot3Waves:  top3[2] ? fmtWaves(top3[2].waveHeight, top3[2].wavePeriod) : '',
  }

  const client = await clerkClient()
  let sent = 0
  let offset = 0
  const pageSize = 500

  while (true) {
    const page = await client.users.getUserList({ limit: pageSize, offset })
    if (page.data.length === 0) break

    for (const user of page.data) {
      const pubMeta = user.publicMetadata as { swellAlertOptIn?: boolean; savedLocations?: SavedLocation[] }
      if (pubMeta.swellAlertOptIn === false) continue

      const email = user.emailAddresses[0]?.emailAddress
      if (!email) continue

      // Fetch saved spots data (up to 3)
      const saved = (pubMeta.savedLocations ?? []).slice(0, 3)
      const spotData = saved.length > 0
        ? await Promise.all(saved.map(s => getSpotData(s.lat, s.lon)))
        : []

      const mySpots: Record<string, string> = {
        mySpot1Name:  saved[0]?.name ?? '',
        mySpot1Waves: spotData[0] ? fmtWaves(spotData[0].height, spotData[0].period) : '',
        mySpot2Name:  saved[1]?.name ?? '',
        mySpot2Waves: spotData[1] ? fmtWaves(spotData[1].height, spotData[1].period) : '',
        mySpot3Name:  saved[2]?.name ?? '',
        mySpot3Waves: spotData[2] ? fmtWaves(spotData[2].height, spotData[2].period) : '',
      }

      await triggerEvent(email, 'weekly_swell_alert', { ...globalProps, ...mySpots })
      sent++
    }

    if (page.data.length < pageSize) break
    offset += pageSize
  }

  return NextResponse.json({ ok: true, sent, spots: top3.map(s => s.name) })
}

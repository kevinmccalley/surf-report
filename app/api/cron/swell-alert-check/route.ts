import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { triggerEvent } from '@/app/lib/loops'
import type { SavedLocation } from '@/app/lib/types'

export const maxDuration = 300

const M_TO_FT = 3.28084
const COOLDOWN_MS = 20 * 60 * 60 * 1000  // 20 hours

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

async function getWaveHeight(lat: number, lon: number): Promise<number> {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=swell_wave_height&forecast_days=1&timezone=UTC`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (data.error || !data.hourly?.swell_wave_height) return 0
    const nowHour = new Date().getUTCHours()
    return data.hourly.swell_wave_height[nowHour] ?? data.hourly.swell_wave_height[0] ?? 0
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clerkClient()
  let sent = 0
  let checked = 0
  let offset = 0
  const pageSize = 500
  const debug: { email: string; spot: string; waveHeightM: number; waveHeightFt: string; thresholdM: number; thresholdFt: string; triggered: boolean; skippedCooldown: boolean }[] = []

  while (true) {
    const page = await client.users.getUserList({ limit: pageSize, offset })
    if (page.data.length === 0) break

    for (const user of page.data) {
      const email = user.emailAddresses[0]?.emailAddress
      if (!email) continue

      const pubMeta = user.publicMetadata as { savedLocations?: SavedLocation[] }
      const locations = pubMeta.savedLocations ?? []
      const alertSpots = locations.filter(l => l.alertThreshold != null)
      if (alertSpots.length === 0) continue

      let metaChanged = false
      const updatedLocations = locations.map(l => ({ ...l }))

      const heights = await Promise.all(
        alertSpots.map(spot => getWaveHeight(spot.lat, spot.lon))
      )

      for (let i = 0; i < alertSpots.length; i++) {
        const spot = alertSpots[i]
        const waveHeight = heights[i]
        const threshold = spot.alertThreshold ?? 0

        const inCooldown = spot.lastAlertedAt
          ? (Date.now() - new Date(spot.lastAlertedAt).getTime()) < COOLDOWN_MS
          : false

        const triggered = !inCooldown && waveHeight >= threshold

        debug.push({
          email,
          spot: spot.name,
          waveHeightM: waveHeight,
          waveHeightFt: (waveHeight * M_TO_FT).toFixed(2),
          thresholdM: threshold,
          thresholdFt: (threshold * M_TO_FT).toFixed(2),
          triggered,
          skippedCooldown: inCooldown,
        })

        if (inCooldown) continue
        checked++
        if (waveHeight < threshold) continue

        await triggerEvent(email, 'swell_threshold_alert', {
          spotName:     spot.name,
          waveHeightFt: (waveHeight * M_TO_FT).toFixed(1),
          waveHeightM:  waveHeight.toFixed(1),
          thresholdFt:  (threshold * M_TO_FT).toFixed(1),
          thresholdM:   threshold.toFixed(1),
        })
        sent++

        const idx = updatedLocations.findIndex(
          l => Math.abs(l.lat - spot.lat) < 0.001 && Math.abs(l.lon - spot.lon) < 0.001
        )
        if (idx >= 0) {
          updatedLocations[idx].lastAlertedAt = new Date().toISOString()
          metaChanged = true
        }
      }

      if (metaChanged) {
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: { savedLocations: updatedLocations },
        })
      }
    }

    if (page.data.length < pageSize) break
    offset += pageSize
  }

  console.log('[swell-alert-check]', JSON.stringify({ sent, checked, debug }))
  return NextResponse.json({ ok: true, sent, checked, debug })
}

import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { rget } from '@/app/lib/redis'
import { triggerEvent } from '@/app/lib/loops'
import type { EpicNowData } from '@/app/lib/types'

export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
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

  const eventProperties: Record<string, string | number> = {
    spot1Name:   top3[0]?.name        ?? '',
    spot1Rating: top3[0]?.ratingLabel ?? '',
    spot1Waves:  top3[0] ? `${top3[0].waveHeight.toFixed(1)}m` : '',
    spot2Name:   top3[1]?.name        ?? '',
    spot2Rating: top3[1]?.ratingLabel ?? '',
    spot2Waves:  top3[1] ? `${top3[1].waveHeight.toFixed(1)}m` : '',
    spot3Name:   top3[2]?.name        ?? '',
    spot3Rating: top3[2]?.ratingLabel ?? '',
    spot3Waves:  top3[2] ? `${top3[2].waveHeight.toFixed(1)}m` : '',
  }

  const client = await clerkClient()
  let sent = 0
  let offset = 0
  const pageSize = 500

  // Paginate through all Clerk users
  while (true) {
    const page = await client.users.getUserList({ limit: pageSize, offset })
    if (page.data.length === 0) break

    for (const user of page.data) {
      const pubMeta = user.publicMetadata as { swellAlertOptIn?: boolean }
      if (pubMeta.swellAlertOptIn === false) continue

      const email = user.emailAddresses[0]?.emailAddress
      if (!email) continue

      await triggerEvent(email, 'weekly_swell_alert', eventProperties)
      sent++
    }

    if (page.data.length < pageSize) break
    offset += pageSize
  }

  return NextResponse.json({ ok: true, sent, spots: top3.map(s => s.name) })
}

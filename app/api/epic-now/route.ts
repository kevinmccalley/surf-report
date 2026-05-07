import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { rget } from '@/app/lib/redis'
import type { EpicNowData } from '@/app/lib/types'

async function isSubscribed(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const meta = user.privateMetadata as { subscriptionStatus?: string }
    const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    return meta.subscriptionStatus === 'active' || (bypassEmails.length > 0 && bypassEmails.includes(userEmail))
  } catch { return false }
}

export async function GET() {
  if (!await isSubscribed()) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 401 })
  }
  const data = await rget<EpicNowData>('epic-now')
  if (!data) return NextResponse.json({ spots: [], updatedAt: null, checkedCount: 0 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=900, stale-while-revalidate=1800' },
  })
}

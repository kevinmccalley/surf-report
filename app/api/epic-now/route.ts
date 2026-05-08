import { NextResponse } from 'next/server'
import { rget } from '@/app/lib/redis'
import type { EpicNowData } from '@/app/lib/types'
import { getSubscriptionTier } from '@/app/lib/subscription'

export async function GET() {
  const tier = await getSubscriptionTier()
  if (tier === 'free') {
    return NextResponse.json({ error: 'Subscription required' }, { status: 401 })
  }
  const data = await rget<EpicNowData>('epic-now')
  if (!data) return NextResponse.json({ spots: [], updatedAt: null, checkedCount: 0 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=900, stale-while-revalidate=1800' },
  })
}

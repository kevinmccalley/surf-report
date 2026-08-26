import { NextResponse } from 'next/server'
import { rget } from '@/app/lib/redis'
import { getSubscriptionTier } from '@/app/lib/subscription'
import type { RegionConditionsSnapshot } from '@/app/lib/spot-conditions'

// Premium-only. The snapshot is written every 6h by /api/cron/region-conditions.
// Free / individual tiers get 403 — individual's unlocked regions still show the
// static break list + map, just not live conditions (spec §7).

export async function GET() {
  const tier = await getSubscriptionTier()
  if (tier !== 'premium') {
    return NextResponse.json({ error: 'tier' }, { status: 403 })
  }

  const snap = await rget<RegionConditionsSnapshot>('region-conditions')
  if (!snap) {
    return NextResponse.json({ spots: {}, updatedAt: null, checkedCount: 0 })
  }

  return NextResponse.json(snap, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=1800' },
  })
}

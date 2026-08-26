import { NextResponse } from 'next/server'
import { rget } from '@/app/lib/redis'
import { getSubscriptionTier } from '@/app/lib/subscription'
import type { RegionConditionsSnapshot } from '@/app/lib/spot-conditions'

// Premium-only. The snapshot is written every 6h by /api/cron/region-conditions.
// Free / individual tiers get 403 — individual's unlocked regions still show the
// static break list + map, just not live conditions (spec §7).
//
// Every response sets `Cache-Control` explicitly: the response so it's `private`
// (this varies by the viewer's tier — it must never land in a shared edge
// cache) and so the broad `/api/:path*` `s-maxage` rule in next.config.mjs
// doesn't apply here.

const CACHE = 'private, max-age=600, stale-while-revalidate=1800'
const NO_STORE = 'private, no-store'

export async function GET() {
  const tier = await getSubscriptionTier()
  if (tier !== 'premium') {
    return NextResponse.json({ error: 'tier' }, { status: 403, headers: { 'Cache-Control': NO_STORE } })
  }

  const snap = await rget<RegionConditionsSnapshot>('region-conditions')
  const body: RegionConditionsSnapshot = snap ?? { spots: {}, updatedAt: '', checkedCount: 0 }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': snap ? CACHE : NO_STORE },
  })
}

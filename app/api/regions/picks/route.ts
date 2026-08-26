import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSubscriptionTier } from '@/app/lib/subscription'
import { sanitizePicks } from '@/app/lib/region-picks'

/**
 * Replace the caller's "My Regions" set. Body: `{ picks: string[] }`.
 * `individual` and `premium` tiers may write; `free` / anon get 403 (they
 * should be shown the paywall instead). The list is sanitised server-side —
 * unknown or flagship slugs are dropped and the set is capped — and the
 * cleaned result is echoed back so the client can reconcile.
 */
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tier = await getSubscriptionTier()
  if (tier === 'free') return NextResponse.json({ error: 'tier' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const raw = (body as { picks?: unknown } | null)?.picks
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const picks = sanitizePicks(raw)

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, { publicMetadata: { pickedRegions: picks } })

  return NextResponse.json({ ok: true, picks })
}

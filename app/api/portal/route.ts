import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const processor = process.env.PAYMENT_PROCESSOR ?? 'stripe'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as {
    stripeCustomerId?: string
    lsCustomerPortalUrl?: string
    lsSubscriptionId?: string
  }

  // ── Lemon Squeezy ───────────────────────────────────────────────────────────
  if (processor === 'lemonsqueezy') {
    // Use cached portal URL if available
    if (meta.lsCustomerPortalUrl) {
      return NextResponse.json({ url: meta.lsCustomerPortalUrl })
    }
    // Fall back to fetching from LS API using the subscription ID
    const subId = meta.lsSubscriptionId
    const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim()
    if (!subId || !apiKey) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }
    const lsRes = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.api+json' },
    })
    if (!lsRes.ok) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }
    const lsData = await lsRes.json()
    const portalUrl: string = lsData.data?.attributes?.urls?.customer_portal ?? ''
    if (!portalUrl) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }
    // Cache it for next time
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { ...user.privateMetadata as Record<string, unknown>, lsCustomerPortalUrl: portalUrl },
    })
    return NextResponse.json({ url: portalUrl })
  }

  // ── Stripe ──────────────────────────────────────────────────────────────────
  if (!meta.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const origin = req.headers.get('origin') ?? 'https://groundswell.surf'
  const session = await stripe.billingPortal.sessions.create({
    customer: meta.stripeCustomerId,
    return_url: origin,
  })

  return NextResponse.json({ url: session.url })
}

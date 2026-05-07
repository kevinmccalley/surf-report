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
  }

  // ── Lemon Squeezy ───────────────────────────────────────────────────────────
  if (processor === 'lemonsqueezy') {
    if (!meta.lsCustomerPortalUrl) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }
    return NextResponse.json({ url: meta.lsCustomerPortalUrl })
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

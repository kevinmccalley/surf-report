import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Price IDs resolved server-side so they never need to be in the client bundle.
// Support both naming conventions in case env vars were added without NEXT_PUBLIC_.
const PRICE_IDS = {
  annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL  || process.env.STRIPE_PRICE_ANNUAL,
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY,
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Accept either { plan: 'annual'|'monthly' } (preferred) or legacy { priceId }
  const plan: 'annual' | 'monthly' | undefined = body.plan
  const priceId: string | undefined = plan ? PRICE_IDS[plan] : body.priceId

  if (!priceId) {
    const missing = plan
      ? `STRIPE_PRICE_${plan.toUpperCase()} (or NEXT_PUBLIC_ variant) is not set in environment variables`
      : 'Missing priceId'
    return NextResponse.json({ error: missing }, { status: 400 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress
  const meta = user.privateMetadata as { stripeCustomerId?: string }

  // Reuse existing Stripe customer if we have one
  let customerId = meta.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId: userId },
    })
    customerId = customer.id
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { ...meta, stripeCustomerId: customerId },
    })
  }

  const origin = req.headers.get('origin') ?? 'https://groundswell.vercel.app'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
    },
    allow_promotion_codes: true,
    success_url: `${origin}/?subscribed=true`,
    cancel_url: `${origin}/`,
  })

  return NextResponse.json({ url: session.url })
}

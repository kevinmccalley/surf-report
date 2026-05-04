import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

// Price IDs resolved server-side — supports both naming conventions.
const PRICE_IDS = {
  annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL  || process.env.STRIPE_PRICE_ANNUAL,
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY,
}

export async function POST(req: NextRequest) {
  // Guard env vars before doing anything that could throw a non-JSON response.
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured — add STRIPE_SECRET_KEY to Vercel environment variables.' },
      { status: 503 }
    )
  }

  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch {
    return NextResponse.json(
      { error: 'Auth context unavailable — Clerk middleware may not be running.' },
      { status: 500 }
    )
  }

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to start a trial.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Accept { plan: 'annual'|'monthly' } (preferred) or legacy { priceId }
  const plan = body.plan as 'annual' | 'monthly' | undefined
  const priceId = (plan ? PRICE_IDS[plan] : body.priceId as string | undefined)

  if (!priceId) {
    const hint = plan
      ? `Add STRIPE_PRICE_${plan.toUpperCase()} (or NEXT_PUBLIC_STRIPE_PRICE_${plan.toUpperCase()}) to your Vercel environment variables.`
      : 'Missing priceId.'
    return NextResponse.json({ error: `No Stripe price ID found. ${hint}` }, { status: 400 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const client = await clerkClient()
    const user   = await client.users.getUser(userId)
    const email  = user.emailAddresses[0]?.emailAddress
    const meta   = user.privateMetadata as { stripeCustomerId?: string }

    let customerId = meta.stripeCustomerId

    // Verify the stored customer exists in the current Stripe mode (live vs test).
    // IDs created in live mode don't exist in test mode and vice versa.
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = undefined
      }
    }

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

    const origin = req.headers.get('origin') ?? 'https://groundswell.surf'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      allow_promotion_codes: true,
      success_url: `${origin}/?subscribed=true`,
      cancel_url:  `${origin}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 })
  }
}

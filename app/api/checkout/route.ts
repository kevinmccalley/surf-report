import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const processor = process.env.PAYMENT_PROCESSOR ?? 'stripe'

// ── Lemon Squeezy ─────────────────────────────────────────────────────────────
async function lsCheckout(plan: 'annual' | 'monthly', email: string, userId: string, origin: string) {
  const variantId = (plan === 'annual'
    ? process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID
    : process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID)?.trim()
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim()
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim()

  if (!variantId || !storeId || !apiKey) {
    return NextResponse.json({ error: 'Lemon Squeezy is not configured.' }, { status: 503 })
  }

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { clerk_user_id: userId },
          },
          product_options: {
            redirect_url: `${origin}/?subscribed=true`,
          },
        },
        relationships: {
          store:   { data: { type: 'stores',   id: storeId } },
          variant: { data: { type: 'variants',  id: variantId } },
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[checkout/ls] error:', err)
    let detail = ''
    try { detail = JSON.parse(err)?.errors?.[0]?.detail ?? err } catch { detail = err }
    return NextResponse.json({ error: `LS ${res.status}: ${detail}` }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ url: data.data?.attributes?.url })
}

// ── Stripe ────────────────────────────────────────────────────────────────────
const STRIPE_PRICE_IDS = {
  annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL  || process.env.STRIPE_PRICE_ANNUAL,
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY,
}

async function stripeCheckout(plan: 'annual' | 'monthly', email: string, userId: string, origin: string, meta: Record<string, unknown>, clerkClientInstance: Awaited<ReturnType<typeof clerkClient>>) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) {
    return NextResponse.json({ error: `No Stripe price ID found for plan: ${plan}` }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let customerId = (meta as { stripeCustomerId?: string }).stripeCustomerId

  if (customerId) {
    try {
      const existing = await stripe.customers.retrieve(customerId)
      if ((existing as { deleted?: boolean }).deleted) customerId = undefined
    } catch { customerId = undefined }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { clerkUserId: userId } })
    customerId = customer.id
    await clerkClientInstance.users.updateUserMetadata(userId, {
      privateMetadata: { ...meta, stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    allow_promotion_codes: true,
    success_url: `${origin}/?subscribed=true`,
    cancel_url: `${origin}/`,
  })

  return NextResponse.json({ url: session.url })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch {
    return NextResponse.json({ error: 'Auth unavailable.' }, { status: 500 })
  }
  if (!userId) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const plan = (body.plan as 'annual' | 'monthly' | undefined) ?? 'annual'
  const origin = req.headers.get('origin') ?? 'https://groundswell.surf'

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress ?? ''
  const meta = user.privateMetadata as Record<string, unknown>

  try {
    if (processor === 'lemonsqueezy') {
      return await lsCheckout(plan, email, userId, origin)
    }
    return await stripeCheckout(plan, email, userId, origin, meta, client)
  } catch (err) {
    console.error('[checkout] unexpected error:', err)
    return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { triggerEvent } from '@/app/lib/loops'

const processor = process.env.PAYMENT_PROCESSOR ?? 'stripe'

// ── Shared: update Clerk subscription status ──────────────────────────────────
async function setSubscriptionStatus(
  client: Awaited<ReturnType<typeof clerkClient>>,
  userId: string,
  status: 'active' | 'inactive',
  extra?: Record<string, unknown>,
) {
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as Record<string, unknown>
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { ...meta, subscriptionStatus: status, ...extra },
  })
}

// ── Lemon Squeezy ─────────────────────────────────────────────────────────────
async function handleLS(req: NextRequest): Promise<NextResponse> {
  const secret = (process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '').trim()
  if (!secret) return NextResponse.json({ error: 'LS not configured' }, { status: 503 })

  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (digest !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name ?? ''
  const status: string = event.data?.attributes?.status ?? ''
  const subscriptionId: string = event.data?.id ?? ''
  const portalUrl: string = event.data?.attributes?.urls?.customer_portal ?? ''
  const userEmail: string = event.data?.attributes?.user_email ?? ''

  const client = await clerkClient()

  // Resolve Clerk user: prefer explicit clerk_user_id, fall back to email lookup
  let clerkUserId: string | undefined = event.meta?.custom_data?.clerk_user_id
  if (!clerkUserId && userEmail) {
    const result = await client.users.getUserList({ emailAddress: [userEmail], limit: 1 })
    clerkUserId = result.data[0]?.id
  }

  if (!clerkUserId) {
    console.warn('[webhook/ls] Could not resolve Clerk user for email:', userEmail)
    return NextResponse.json({ received: true })
  }

  const isActive = ['active', 'on_trial'].includes(status)

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
      await setSubscriptionStatus(client, clerkUserId, isActive ? 'active' : 'inactive', {
        lsSubscriptionId: subscriptionId,
        lsCustomerPortalUrl: portalUrl,
      })
      break
    case 'subscription_cancelled':
    case 'subscription_expired':
      await setSubscriptionStatus(client, clerkUserId, 'inactive', {
        lsSubscriptionId: subscriptionId,
      })
      if (userEmail) await triggerEvent(userEmail, 'subscription_cancelled')
      break
  }

  return NextResponse.json({ received: true })
}

// ── Stripe ────────────────────────────────────────────────────────────────────
async function handleStripe(req: NextRequest): Promise<NextResponse> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const client = await clerkClient()

  async function updateByCustomer(customerId: string, status: 'active' | 'inactive') {
    const users = await client.users.getUserList({ limit: 500 })
    const user = users.data.find(
      u => (u.privateMetadata as { stripeCustomerId?: string }).stripeCustomerId === customerId
    )
    if (!user) return
    const meta = user.privateMetadata as Record<string, unknown>
    await client.users.updateUserMetadata(user.id, {
      privateMetadata: { ...meta, subscriptionStatus: status },
    })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'inactive'
      await updateByCustomer(sub.customer as string, status)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateByCustomer(sub.customer as string, 'inactive')
      // Churn recovery: find the user email and trigger Loops event
      const cancelledUsers = await client.users.getUserList({ limit: 500 })
      const cancelledUser = cancelledUsers.data.find(
        u => (u.privateMetadata as { stripeCustomerId?: string }).stripeCustomerId === (sub.customer as string)
      )
      if (cancelledUser) {
        const email = cancelledUser.emailAddresses[0]?.emailAddress
        if (email) await triggerEvent(email, 'subscription_cancelled')
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  return processor === 'lemonsqueezy' ? handleLS(req) : handleStripe(req)
}

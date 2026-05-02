import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const client = await clerkClient()

  async function updateSubscription(customerId: string, status: 'active' | 'inactive') {
    // Find Clerk user by stripeCustomerId in privateMetadata
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
      await updateSubscription(sub.customer as string, status)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateSubscription(sub.customer as string, 'inactive')
      break
    }
  }

  return NextResponse.json({ received: true })
}

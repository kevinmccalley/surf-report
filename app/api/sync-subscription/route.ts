import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { isPremiumPriceId } from '@/app/lib/subscription'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ tier: 'free' })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as Record<string, unknown>
  const userEmail = user.emailAddresses[0]?.emailAddress ?? ''

  if (meta.subscriptionStatus === 'active') {
    return NextResponse.json({ tier: meta.subscriptionTier === 'premium' ? 'premium' : 'individual' })
  }

  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ tier: 'free' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let activeSub: Stripe.Subscription | undefined
  let resolvedCustomerId = meta.stripeCustomerId as string | undefined

  if (resolvedCustomerId) {
    const subs = await stripe.subscriptions.list({ customer: resolvedCustomerId, limit: 5 })
    activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
  }

  if (!activeSub && userEmail) {
    const customers = await stripe.customers.list({ email: userEmail, limit: 5 })
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 })
      activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
      if (activeSub) { resolvedCustomerId = customer.id; break }
    }
  }

  if (!activeSub) return NextResponse.json({ tier: 'free' })

  const priceId = activeSub.items.data[0]?.price?.id ?? ''
  const tier = isPremiumPriceId(priceId) ? 'premium' : 'individual'

  await client.users.updateUserMetadata(userId, {
    privateMetadata: { ...meta, subscriptionStatus: 'active', subscriptionTier: tier, stripeCustomerId: resolvedCustomerId },
  })

  return NextResponse.json({ tier })
}

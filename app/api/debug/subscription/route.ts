import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

// Diagnostic endpoint — reads current user's Clerk metadata and Stripe subscription state.
// Also performs the fix if ?fix=true is passed and a subscription is found.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as Record<string, unknown>
  const email = user.emailAddresses[0]?.emailAddress ?? ''

  const diag: Record<string, unknown> = {
    clerkUserId: userId,
    email,
    clerkPrivateMeta: meta,
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ ...diag, stripeError: 'STRIPE_SECRET_KEY not set' })
  }

  const stripe = new Stripe(stripeKey)

  // Try by stored customerId first
  const storedCustomerId = meta.stripeCustomerId as string | undefined
  if (storedCustomerId) {
    diag.storedCustomerId = storedCustomerId
    try {
      const subs = await stripe.subscriptions.list({ customer: storedCustomerId, limit: 5 })
      diag.stripeSubscriptions = subs.data.map(s => ({
        id: s.id,
        status: s.status,
        priceId: s.items.data[0]?.price?.id,
        created: new Date(s.created * 1000).toISOString(),
      }))
      const activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
      diag.activeSubFound = !!activeSub

      if (activeSub && req.nextUrl.searchParams.get('fix') === 'true') {
        const priceId = activeSub.items.data[0]?.price?.id ?? ''
        const isPremium = priceId === process.env.STRIPE_PRICE_MONTHLY_PREMIUM || priceId === process.env.STRIPE_PRICE_YEARLY_PREMIUM
        const tier = isPremium ? 'premium' : 'individual'
        await client.users.updateUserMetadata(userId, {
          privateMetadata: { ...meta, subscriptionStatus: 'active', subscriptionTier: tier },
        })
        diag.fixed = true
        diag.fixedTier = tier
      }
    } catch (err) {
      diag.stripeSubError = String(err)
    }
  } else {
    diag.storedCustomerId = null
    // Try looking up by email in Stripe
    try {
      const customers = await stripe.customers.list({ email, limit: 5 })
      diag.stripeCustomersByEmail = customers.data.map(c => ({
        id: c.id,
        email: c.email,
        metadata: c.metadata,
        created: new Date(c.created * 1000).toISOString(),
      }))

      // Find the customer that has clerkUserId matching this user, or any customer with an active sub
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 })
        const activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
        if (activeSub) {
          diag.foundActiveSubViaEmail = { customerId: customer.id, subId: activeSub.id, status: activeSub.status }

          if (req.nextUrl.searchParams.get('fix') === 'true') {
            const priceId = activeSub.items.data[0]?.price?.id ?? ''
            const isPremium = priceId === process.env.STRIPE_PRICE_MONTHLY_PREMIUM || priceId === process.env.STRIPE_PRICE_YEARLY_PREMIUM
            const tier = isPremium ? 'premium' : 'individual'
            await client.users.updateUserMetadata(userId, {
              privateMetadata: { ...meta, subscriptionStatus: 'active', subscriptionTier: tier, stripeCustomerId: customer.id },
            })
            diag.fixed = true
            diag.fixedTier = tier
          }
          break
        }
      }
    } catch (err) {
      diag.emailLookupError = String(err)
    }
  }

  return NextResponse.json(diag, { status: 200 })
}

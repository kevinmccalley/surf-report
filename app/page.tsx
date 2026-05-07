import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import SurfApp from './components/SurfApp'

export type Tier = 'free' | 'base'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>
}) {
  const params = await searchParams
  let tier: Tier = 'free'

  try {
    const { userId } = await auth()

    if (userId) {
      const client = await clerkClient()
      const user   = await client.users.getUser(userId)
      const meta   = user.privateMetadata as { subscriptionStatus?: string; stripeCustomerId?: string }

      const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''

      if (bypassEmails.length > 0 && bypassEmails.includes(userEmail)) {
        tier = 'base'
      } else if (meta.subscriptionStatus === 'active') {
        tier = 'base'
      } else if (params.subscribed === 'true' && meta.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
          const subs   = await stripe.subscriptions.list({ customer: meta.stripeCustomerId, limit: 5 })
          const isActive = subs.data.some(s => s.status === 'active' || s.status === 'trialing')
          if (isActive) {
            await client.users.updateUserMetadata(userId, {
              privateMetadata: { ...meta, subscriptionStatus: 'active' },
            })
            tier = 'base'
          }
        } catch {
          // Stripe check failed — remain free
        }
      }
    }
  } catch {
    // Auth or Clerk API failure — remain free
  }

  return <SurfApp tier={tier} />
}

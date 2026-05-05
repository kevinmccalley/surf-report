import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import SurfApp from './components/SurfApp'
import MarketingPage from './components/MarketingPage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>
}) {
  const params = await searchParams

  try {
    const { userId } = await auth()

    if (userId) {
      const client = await clerkClient()
      const user   = await client.users.getUser(userId)
      const meta   = user.privateMetadata as { subscriptionStatus?: string; stripeCustomerId?: string }

      // Bypass whitelist — specific emails skip the paywall entirely
      const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
      if (bypassEmails.length > 0 && bypassEmails.includes(userEmail)) {
        return <SurfApp />
      }

      // Already marked active from a previous webhook
      if (meta.subscriptionStatus === 'active') {
        return <SurfApp />
      }

      // Returning from Stripe checkout — verify subscription directly rather than
      // waiting for the webhook, which may arrive after the redirect.
      if (params.subscribed === 'true' && meta.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
          const subs   = await stripe.subscriptions.list({
            customer: meta.stripeCustomerId,
            limit: 5,
          })
          const isActive = subs.data.some(
            s => s.status === 'active' || s.status === 'trialing'
          )
          if (isActive) {
            await client.users.updateUserMetadata(userId, {
              privateMetadata: { ...meta, subscriptionStatus: 'active' },
            })
            return <SurfApp />
          }
        } catch {
          // Stripe check failed — fall through to marketing page
        }
      }
    }
  } catch {
    // Auth or Clerk API failure — fall through to marketing page
  }

  return <MarketingPage />
}

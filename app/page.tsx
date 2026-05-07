import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import SurfApp from './components/SurfApp'

export type Tier = 'free' | 'base'

type SearchParams = Promise<{ name?: string; country?: string; lat?: string; lon?: string; subscribed?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams
  const { name, country } = params

  if (!name) {
    return {
      title: 'Groundswell — Surf Reports Worldwide',
      description: 'Real-time surf reports and 10-day forecasts for any spot in the world. Wave height, swell, wind, tides, and more.',
    }
  }

  const location = country ? `${name}, ${country}` : name
  const title = `${location} Surf Report — Groundswell`
  const description = `Live surf report for ${name}: wave height, swell, wind, tides, and 10-day forecast. Updated hourly from open ocean data sources.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
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

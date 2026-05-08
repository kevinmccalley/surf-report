import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import SurfApp from './components/SurfApp'

export type Tier = 'free' | 'individual' | 'premium'

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
      const meta   = user.privateMetadata as { subscriptionStatus?: string; subscriptionTier?: string; stripeCustomerId?: string; lsSubscriptionId?: string }

      const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''

      if (bypassEmails.length > 0 && bypassEmails.includes(userEmail)) {
        tier = 'premium'
      } else if (meta.subscriptionStatus === 'active') {
        tier = meta.subscriptionTier === 'premium' ? 'premium' : 'individual'
      } else if (params.subscribed === 'true') {
        // ── Lemon Squeezy fallback ──────────────────────────────────────────
        if (process.env.PAYMENT_PROCESSOR === 'lemonsqueezy' && process.env.LEMONSQUEEZY_API_KEY) {
          try {
            const lsRes = await fetch(
              `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${process.env.LEMONSQUEEZY_STORE_ID?.trim()}&filter[user_email]=${encodeURIComponent(userEmail)}&sort=-createdAt`,
              { headers: { Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY.trim()}`, Accept: 'application/vnd.api+json' } }
            )
            const lsData = await lsRes.json()
            const activeSub = (lsData.data ?? []).find((s: { attributes: { status: string } }) =>
              ['active', 'on_trial'].includes(s.attributes.status)
            )
            if (activeSub) {
              await client.users.updateUserMetadata(userId, {
                privateMetadata: {
                  ...meta,
                  subscriptionStatus: 'active',
                  lsSubscriptionId: activeSub.id,
                  lsCustomerPortalUrl: activeSub.attributes?.urls?.customer_portal ?? '',
                },
              })
              tier = 'individual'
            }
          } catch {
            // LS check failed — remain free
          }
        }
        // ── Stripe fallback ─────────────────────────────────────────────────
        if (tier === 'free' && meta.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            const subs   = await stripe.subscriptions.list({ customer: meta.stripeCustomerId, limit: 5 })
            const activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
            if (activeSub) {
              const priceId = activeSub.items.data[0]?.price?.id ?? ''
              const isPremiumPrice = priceId === process.env.STRIPE_PRICE_MONTHLY_PREMIUM || priceId === process.env.STRIPE_PRICE_YEARLY_PREMIUM
              const resolvedTier = isPremiumPrice ? 'premium' : 'individual'
              await client.users.updateUserMetadata(userId, {
                privateMetadata: { ...meta, subscriptionStatus: 'active', subscriptionTier: resolvedTier },
              })
              tier = resolvedTier
            }
          } catch {
            // Stripe check failed — remain free
          }
        }
      }
    }
  } catch {
    // Auth or Clerk API failure — remain free
  }

  return <SurfApp tier={tier} />
}

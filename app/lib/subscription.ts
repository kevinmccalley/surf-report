import { auth, clerkClient } from '@clerk/nextjs/server'

export type SubscriptionTier = 'free' | 'individual' | 'premium'

interface UserMeta {
  subscriptionStatus?: string
  subscriptionTier?: string
}

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  try {
    const { userId } = await auth()
    if (!userId) return 'free'
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const meta = user.privateMetadata as UserMeta
    const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const userEmails = user.emailAddresses.map(e => e.emailAddress?.toLowerCase() ?? '').filter(Boolean)
    const isBypassed = bypassEmails.length > 0 && userEmails.some(e => bypassEmails.includes(e))

    if (meta.subscriptionStatus !== 'active' && !isBypassed) return 'free'
    if (isBypassed || meta.subscriptionTier === 'premium') return 'premium'
    return 'individual'
  } catch {
    return 'free'
  }
}

/**
 * The region slugs an `individual`-tier subscriber has chosen to unlock
 * ("My Regions"). Stored on Clerk `publicMetadata.pickedRegions` — user-writable
 * (via /api/regions/picks), same as saved locations. Returns `[]` for anon /
 * free / on any error; callers still pass it through `regionLockState`, which
 * only honours picks for the `individual` tier.
 */
export async function getPickedRegions(): Promise<string[]> {
  try {
    const { userId } = await auth()
    if (!userId) return []
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const picks = (user.publicMetadata as { pickedRegions?: unknown }).pickedRegions
    return Array.isArray(picks) ? picks.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function isPremiumPriceId(priceId: string): boolean {
  return (
    priceId === process.env.STRIPE_PRICE_MONTHLY_PREMIUM ||
    priceId === process.env.STRIPE_PRICE_YEARLY_PREMIUM
  )
}

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
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    const isBypassed = bypassEmails.length > 0 && bypassEmails.includes(userEmail)

    if (meta.subscriptionStatus !== 'active' && !isBypassed) return 'free'
    if (isBypassed || meta.subscriptionTier === 'premium') return 'premium'
    return 'individual'
  } catch {
    return 'free'
  }
}

export function isPremiumPriceId(priceId: string): boolean {
  return (
    priceId === process.env.STRIPE_PRICE_MONTHLY_PREMIUM ||
    priceId === process.env.STRIPE_PRICE_YEARLY_PREMIUM
  )
}

import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const FREE_LIMIT = 7

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    // Unauthenticated — client manages count in localStorage
    return NextResponse.json({ authenticated: false, subscribed: false, count: 0, limit: FREE_LIMIT })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as { subscriptionStatus?: string; usageCount?: number }

  const subscribed = meta.subscriptionStatus === 'active'
  const count = (meta.usageCount as number) ?? 0

  return NextResponse.json({ authenticated: true, subscribed, count, limit: FREE_LIMIT })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: true }) // client handles locally
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as { subscriptionStatus?: string; usageCount?: number }

  if (meta.subscriptionStatus === 'active') {
    return NextResponse.json({ ok: true, subscribed: true })
  }

  const newCount = ((meta.usageCount as number) ?? 0) + 1
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { ...meta, usageCount: newCount },
  })

  return NextResponse.json({ ok: true, count: newCount, limit: FREE_LIMIT })
}

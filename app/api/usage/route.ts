import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ authenticated: false, subscribed: false })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as { subscriptionStatus?: string }
  const subscribed = meta.subscriptionStatus === 'active'

  return NextResponse.json({ authenticated: true, subscribed })
}

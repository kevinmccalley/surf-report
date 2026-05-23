import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { syncContact } from '@/app/lib/loops'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { swellAlertOptIn } = body as { swellAlertOptIn?: boolean }
  if (typeof swellAlertOptIn !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { swellAlertOptIn },
  })

  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress
  if (email) await syncContact(email, userId, { swellAlertOptIn })

  return NextResponse.json({ ok: true })
}

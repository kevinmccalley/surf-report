import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.privateMetadata as { stripeCustomerId?: string }

  if (!meta.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'https://groundswell.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: meta.stripeCustomerId,
    return_url: origin,
  })

  return NextResponse.json({ url: session.url })
}

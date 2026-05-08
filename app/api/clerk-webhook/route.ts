import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { syncContact, triggerEvent } from '@/app/lib/loops'

function verify(body: string, svixId: string, svixTimestamp: string, svixSig: string, secret: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const msg = `${svixId}.${svixTimestamp}.${body}`
  const hash = crypto.createHmac('sha256', secretBytes).update(msg).digest('base64')
  return svixSig.split(' ').some(s => {
    const parts = s.split(',')
    return parts.length === 2 && parts[1] === hash
  })
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const body = await req.text()
  const svixId        = req.headers.get('svix-id') ?? ''
  const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
  const svixSig       = req.headers.get('svix-signature') ?? ''

  if (!verify(body, svixId, svixTimestamp, svixSig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  if (event.type !== 'user.created') return NextResponse.json({ received: true })

  const data = event.data
  const email: string = data.email_addresses?.[0]?.email_address ?? ''
  if (!email) return NextResponse.json({ received: true })

  const userId: string = data.id ?? ''
  const firstName: string = data.first_name ?? ''
  const lastName:  string = data.last_name  ?? ''

  await syncContact(email, userId, {
    firstName,
    lastName,
    subscriptionStatus: 'free',
    swellAlertOptIn: true,
  })

  await triggerEvent(email, 'user_created', { firstName, userId })

  return NextResponse.json({ received: true })
}

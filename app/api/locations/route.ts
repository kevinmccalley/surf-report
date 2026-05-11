import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { SavedLocation } from '@/app/lib/types'
import { getSubscriptionTier } from '@/app/lib/subscription'

const FREE_LIMIT = 1

async function getContext() {
  const { userId } = await auth()
  if (!userId) return null
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const pubMeta = user.publicMetadata as { savedLocations?: SavedLocation[] }
  const tier = await getSubscriptionTier()
  const isPaid = tier !== 'free'
  return { userId, client, isPaid, saved: pubMeta.savedLocations ?? [] }
}

export async function POST(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, client, isPaid, saved } = ctx

  const body = await request.json() as Omit<SavedLocation, 'savedAt'>

  if (saved.some(s => Math.abs(s.lat - body.lat) < 0.001 && Math.abs(s.lon - body.lon) < 0.001)) {
    return NextResponse.json({ ok: true })
  }

  const limit = isPaid ? Infinity : FREE_LIMIT
  if (saved.length >= limit) {
    return NextResponse.json({ error: 'limit', tier: isPaid ? 'paid' : 'free' }, { status: 403 })
  }

  const updated = [...saved, { ...body, savedAt: new Date().toISOString() }]
  await client.users.updateUserMetadata(userId, { publicMetadata: { savedLocations: updated } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, client, saved } = ctx

  const { lat, lon, alertThreshold } = await request.json() as { lat: number; lon: number; alertThreshold: number | null }
  const updated = saved.map(s =>
    Math.abs(s.lat - lat) < 0.001 && Math.abs(s.lon - lon) < 0.001
      ? { ...s, alertThreshold: alertThreshold ?? undefined, lastAlertedAt: undefined }
      : s
  )
  await client.users.updateUserMetadata(userId, { publicMetadata: { savedLocations: updated } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, client, saved } = ctx

  const { lat, lon } = await request.json()
  const updated = saved.filter(s => !(Math.abs(s.lat - lat) < 0.001 && Math.abs(s.lon - lon) < 0.001))
  await client.users.updateUserMetadata(userId, { publicMetadata: { savedLocations: updated } })
  return NextResponse.json({ ok: true })
}

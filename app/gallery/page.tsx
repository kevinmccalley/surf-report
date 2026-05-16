import fs from 'fs'
import path from 'path'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import GalleryClient from './GalleryClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Surf Gallery — Groundswell',
  description: 'World-class surf spot photography',
}

export default async function GalleryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
  const allowed = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(email)) redirect('/')

  const dir = path.join(process.cwd(), 'public', 'images', 'topSpots')
  let images: string[] = []
  try {
    images = fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
  } catch {}
  return <GalleryClient images={images} />
}

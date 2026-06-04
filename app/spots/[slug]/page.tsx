import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import SurfApp from '@/app/components/SurfApp'
import type { Tier } from '@/app/page'
import { findSpotBySlug } from '@/app/lib/surf-spots'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const BASE_URL = 'https://groundswell.surf'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const spot = findSpotBySlug(slug)
  if (!spot) return {}

  const title = `${spot.name} Surf Report — Groundswell`
  const description = `Live surf conditions and 10-day forecast for ${spot.name}, ${spot.country}. Wave height, swell period and direction, wind, water temperature, and tides — updated hourly from open ocean data.`
  const canonical = `${BASE_URL}/spots/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: 'Groundswell',
      images: [{ url: '/api/og', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/api/og'],
    },
  }
}

export default async function SpotPage({ params }: Props) {
  const { slug } = await params
  const spot = findSpotBySlug(slug)
  if (!spot) notFound()

  let tier: Tier = 'free'
  try {
    const { userId } = await auth()
    if (userId) {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const meta = user.privateMetadata as { subscriptionStatus?: string; subscriptionTier?: string }
      const bypassEmails = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      const userEmails = user.emailAddresses.map(e => e.emailAddress?.toLowerCase() ?? '').filter(Boolean)
      if (bypassEmails.length > 0 && userEmails.some(e => bypassEmails.includes(e))) {
        tier = 'premium'
      } else if (meta.subscriptionStatus === 'active') {
        tier = meta.subscriptionTier === 'premium' ? 'premium' : 'individual'
      }
    }
  } catch {}

  const initialGeo = {
    name: spot.name,
    country: spot.country,
    lat: spot.lat,
    lon: spot.lon,
    displayName: `${spot.name}, ${spot.country}`,
  }

  return <SurfApp tier={tier} initialGeo={initialGeo} />
}

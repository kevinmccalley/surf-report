import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { auth, clerkClient } from '@clerk/nextjs/server'
import SurfApp from '@/app/components/SurfApp'
import type { Tier } from '@/app/page'
import { findSpotBySlug, getAllSpots, slugify, type SurfSpot } from '@/app/lib/surf-spots'
import { findCalibration, type SpotCalibration } from '@/app/lib/spot-calibration'
import { getClimatologyData, directionLabel } from '@/app/lib/climatology'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const BASE_URL = 'https://groundswell.surf'
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Pure helpers ──────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

type NearbySpot = { name: string; slug: string; country: string; distanceKm: number }

function computeNearbySpots(target: SurfSpot, limit: number): NearbySpot[] {
  return getAllSpots()
    .filter(s => !(Math.abs(s.lat - target.lat) < 0.0001 && Math.abs(s.lon - target.lon) < 0.0001))
    .map(s => ({
      name: s.name,
      slug: slugify(s.name),
      country: s.country,
      distanceKm: Math.round(haversineKm(target.lat, target.lon, s.lat, s.lon)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

function buildBestConditionsText(cal: SpotCalibration): string | null {
  const parts: string[] = []
  if (cal.dirMin !== undefined && cal.dirMax !== undefined) {
    const from = directionLabel(cal.dirMin)
    const to = directionLabel(cal.dirMax)
    parts.push(from === to ? `${from} swell` : `${from}–${to} swell`)
  }
  const minFt = Math.round(cal.minSwellM * 3.28)
  parts.push(`${cal.minSwellM.toFixed(1)} m (${minFt} ft) minimum`)
  if (cal.minPeriod) parts.push(`${cal.minPeriod}s+ period`)
  if (cal.facingDirection !== undefined) {
    const offshore = (cal.facingDirection + 180) % 360
    parts.push(`offshore winds from ${directionLabel(offshore)}`)
  }
  return parts.length ? parts.join(' · ') : null
}

function buildSpotJsonLd(spot: SurfSpot, slug: string) {
  const url = `${BASE_URL}/spots/${slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `${spot.name} Surf Report — Groundswell`,
        // speakable marks the H1 and the peak-season/best-conditions summary cards
        // so Google AI Overviews and voice search can read the most useful content.
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.speakable-heading', '.speakable-summary'],
        },
      },
      {
        '@type': 'SportsActivityLocation',
        '@id': `${url}#place`,
        name: `${spot.name} Surf Spot`,
        description: `Live surf conditions and 10-day forecast for ${spot.name}, ${spot.country}.`,
        url,
        geo: { '@type': 'GeoCoordinates', latitude: spot.lat, longitude: spot.lon },
        containedInPlace: { '@type': 'Place', name: spot.country },
        sport: 'Surfing',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Surf Spots', item: `${BASE_URL}/spots` },
          { '@type': 'ListItem', position: 3, name: spot.name, item: url },
        ],
      },
    ],
  }
}

// ── Static SEO section (server-rendered) ─────────────────────────────────────

interface StaticSectionProps {
  spot: SurfSpot
  slug: string
  calibration: SpotCalibration | null
  peakSeasonText: string
  nearbySpots: NearbySpot[]
}

function SpotStaticSection({ spot, slug, calibration, peakSeasonText, nearbySpots }: StaticSectionProps) {
  const jsonLd = buildSpotJsonLd(spot, slug)
  const bestConditions = calibration ? buildBestConditionsText(calibration) : null

  return (
    <div className="theme-bg border-t border-white/5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">

        {/* Heading */}
        <div>
          <h1 className="speakable-heading text-2xl sm:text-3xl font-bold text-white">
            {spot.name} Surf Report
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {spot.country} · {spot.lat.toFixed(4)}°, {spot.lon.toFixed(4)}°
          </p>
          {spot.aliases && spot.aliases.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              Also known as: {spot.aliases.join(', ')}
            </p>
          )}
        </div>

        {/* Info cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl px-4 py-3 border border-teal-500/20 bg-teal-500/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Peak Season</p>
            <p className="speakable-summary text-sm text-teal-300 font-medium">{peakSeasonText}</p>
          </div>
          {bestConditions && (
            <div className="glass-card rounded-xl px-4 py-3 border border-sky-500/20 bg-sky-500/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Best Conditions</p>
              <p className="speakable-summary text-sm text-slate-300">{bestConditions}</p>
            </div>
          )}
        </div>

        {/* Climatology link */}
        <Link
          href={`/climatology/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
        >
          View {spot.name} seasonal wave data
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* Nearby spots */}
        {nearbySpots.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Nearby Surf Spots
            </p>
            <ul className="flex flex-wrap gap-2">
              {nearbySpots.map(s => (
                <li key={s.slug}>
                  <Link
                    href={`/spots/${s.slug}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-sky-500/40 transition-colors"
                  >
                    {s.name}
                    {s.distanceKm > 0 && (
                      <span className="text-slate-600 ml-1">{s.distanceKm} km</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </div>
  )
}

// ── Metadata ──────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SpotPage({ params }: Props) {
  const { slug } = await params
  const spot = findSpotBySlug(slug)
  if (!spot) notFound()

  // Tier detection (unchanged)
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

  // Static SEO data — all in-memory, zero latency
  const calibration = findCalibration(spot.lat, spot.lon)
  const nearbySpots = computeNearbySpots(spot, 5)

  // Peak season from cached climatology API (1.5 s timeout → hemisphere fallback)
  let peakSeasonText: string
  try {
    const latR = Math.round(spot.lat * 2) / 2
    const lonR = Math.round(spot.lon * 2) / 2
    const months = await Promise.race([
      getClimatologyData(latR, lonR),
      new Promise<null>(r => setTimeout(() => r(null), 1500)),
    ])
    if (months && months.length > 0 && months.some(m => m.sampleSize > 0)) {
      const sorted = [...months].sort((a, b) => b.score - a.score)
      const peakMonths = sorted.slice(0, 2).map(m => m.month).sort((a, b) => a - b)
      peakSeasonText = peakMonths.map(m => MONTH_NAMES[m - 1]).join(' & ')
    } else {
      throw new Error('no data')
    }
  } catch {
    peakSeasonText = spot.lat >= 0 ? 'Oct – Mar' : 'Apr – Sep'
  }

  const initialGeo = {
    name: spot.name,
    country: spot.country,
    lat: spot.lat,
    lon: spot.lon,
    displayName: `${spot.name}, ${spot.country}`,
  }

  return (
    <>
      <SurfApp tier={tier} initialGeo={initialGeo} />
      <SpotStaticSection
        spot={spot}
        slug={slug}
        calibration={calibration}
        peakSeasonText={peakSeasonText}
        nearbySpots={nearbySpots}
      />
    </>
  )
}

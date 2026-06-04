import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { findSpotBySlug, slugify } from '@/app/lib/surf-spots'
import { getClimatologyData } from '@/app/lib/climatology'
import { getPostsForSpot } from '@/app/lib/sanity'
import ClimatologySection from '@/app/components/ClimatologySection'
import { serverT } from '@/app/lib/server-t'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

interface Props {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ lang?: string }>
}

export const revalidate = 86400 // 24 h ISR — re-render on first request after expiry

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const lang = (await searchParams)?.lang ?? 'en'
  const spot = findSpotBySlug(slug)
  if (!spot) return { title: 'Surf Climatology' }

  const climatologyLabel = serverT(lang, 'meta.surfClimatology')
  const bestTimeLabel = serverT(lang, 'meta.bestTimeToSurf')
  const title = `${spot.name} ${climatologyLabel} — ${bestTimeLabel} — Groundswell`
  const description =
    `Monthly swell averages, peak season, and dominant direction at ${spot.name}, ${spot.country}. ` +
    `3-year historical wave data to help you plan the perfect surf trip.`

  const canonical = `${BASE_URL}/climatology/${slug}`
  const hreflangLanguages: Record<string, string> = { 'x-default': canonical }
  for (const locale of LOCALES) {
    hreflangLanguages[locale] = locale === 'en' ? canonical : `${canonical}?lang=${locale}`
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: hreflangLanguages,
    },
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

export default async function ClimatologyPage({ params }: Props) {
  const { slug } = await params
  const spot = findSpotBySlug(slug)
  if (!spot) notFound()

  const latR = Math.round(spot.lat * 2) / 2
  const lonR = Math.round(spot.lon * 2) / 2

  let months, peakMonths
  try {
    months = await getClimatologyData(latR, lonR)
    if (months.every(m => m.sampleSize === 0)) notFound()
    const sorted = [...months].sort((a, b) => b.score - a.score)
    peakMonths = sorted.slice(0, 2).map(m => m.month).sort((a, b) => a - b)
  } catch {
    notFound()
  }

  const relatedPosts = await getPostsForSpot(slug)

  const peakNames = peakMonths
    .map(m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1])
    .join(' & ')

  const spotUrl = `${BASE_URL}/climatology/${slugify(spot.name)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        name: spot.name,
        description: `Monthly swell averages, peak season, and dominant direction at ${spot.name}, ${spot.country}.`,
        geo: { '@type': 'GeoCoordinates', latitude: spot.lat, longitude: spot.lon },
        url: spotUrl,
      },
      {
        '@type': 'Dataset',
        name: `${spot.name} Surf Climatology — Monthly Wave Averages`,
        description:
          `Monthly offshore significant wave height (Hs), swell direction, and peak season for ${spot.name}, ${spot.country}. ` +
          `Derived from ERA5 reanalysis data provided by Open-Meteo, covering 2022–2024.`,
        url: spotUrl,
        temporalCoverage: '2022/2024',
        spatialCoverage: {
          '@type': 'Place',
          name: `${spot.name}, ${spot.country}`,
          geo: { '@type': 'GeoCoordinates', latitude: spot.lat, longitude: spot.lon },
        },
        measurementTechnique: 'ERA5 reanalysis offshore significant wave height (Hs) via Open-Meteo',
        variableMeasured: 'Significant wave height in metres',
        creator: {
          '@type': 'Organization',
          '@id': 'https://groundswell.surf/#organization',
          name: 'Groundswell',
          url: BASE_URL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Surf Climatology', item: `${BASE_URL}/climatology` },
          { '@type': 'ListItem', position: 3, name: `${spot.name}, ${spot.country}`, item: spotUrl },
        ],
      },
    ],
  }

  return (
    <div className="theme-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Header */}
      <header className="theme-header sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <a href="/" aria-label="Groundswell home" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
              Groundswell
            </span>
          </a>
          <div className="flex-1" />
          <a
            href="/"
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors border border-sky-500/25 hover:border-sky-400/40 rounded-lg px-3 py-1.5"
          >
            Live forecast →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 space-y-6">

        {/* Location header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Surf Climatology
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{spot.name}</h1>
          <p className="text-slate-400">{spot.country}</p>
        </div>

        {/* Peak season callout */}
        {peakMonths.length > 0 && (
          <div className="glass-card rounded-xl px-4 py-3 border border-teal-500/20 bg-teal-500/5 flex items-center gap-3">
            <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <div>
              <p className="text-sm text-teal-300 font-medium">
                Peak surf season: <span className="font-bold">{peakNames}</span>
              </p>
              <p className="text-xs text-teal-400/60 mt-0.5">
                Based on 3-year average offshore wave height · 2022–2024
              </p>
            </div>
          </div>
        )}

        {/* Climatology chart */}
        <section className="glass-card rounded-2xl p-4 sm:p-6">
          <ClimatologySection months={months} peakMonths={peakMonths} />
        </section>

        {/* Data note */}
        <p className="text-xs text-slate-600 text-center">
          Offshore significant wave height (Hs) from Open-Meteo ERA5 reanalysis · 2022–2024 ·
          Coordinates {latR.toFixed(1)}°, {lonR.toFixed(1)}°
        </p>

        {/* CTA */}
        <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-white/5">
          <p className="text-sm text-slate-300">
            Ready to check live conditions at {spot.name}?
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200 transition-colors text-sm font-medium"
          >
            Open live surf report
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

        {/* Related blog posts */}
        {relatedPosts.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Related articles
            </p>
            <div className="flex flex-col gap-3">
              {relatedPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="glass-card rounded-xl px-4 py-3 border border-white/5 hover:border-sky-500/30 transition-colors group"
                >
                  <p className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors leading-snug">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

function WaveLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

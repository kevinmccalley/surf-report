import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverT } from '@/app/lib/server-t'
import { getServerLocale } from '@/app/lib/server-locale'
import { getSubscriptionTier, getPickedRegions } from '@/app/lib/subscription'
import {
  getSurfRegions,
  getSurfRegionsByCountry,
  getRegionMapPoints,
  getCountryAggregate,
  countryName,
} from '@/app/lib/surf-regions'
import { countryLockState } from '@/app/lib/region-access'
import SiteHeader from '@/app/components/SiteHeader'
import RegionDetailClient, { type DetailPoint } from '../../RegionDetailClient'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://groundswell.surf'

type Props = {
  params: Promise<{ code: string }>
  searchParams?: Promise<{ lang?: string }>
}

export function generateStaticParams() {
  // Only countries with more than one region get an aggregate route.
  const counts = new Map<string, number>()
  for (const r of getSurfRegions()) {
    const code = r.country.toLowerCase()
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([code]) => ({ code }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { code } = await params
  const regions = getSurfRegionsByCountry(code)
  if (regions.length < 2) return {}

  const lang = await getServerLocale((await searchParams)?.lang)
  const name = countryName(code)
  const title = `${name} — ${serverT(lang, 'regions.meta.title')}`
  const description = serverT(lang, 'regions.country.subtitle').replace('{country}', name)
  const canonical = `${BASE_URL}/regions/country/${code.toLowerCase()}`
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(description)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Groundswell',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
  }
}

export default async function CountryAggregatePage({ params, searchParams }: Props) {
  const { code } = await params
  const regions = getSurfRegionsByCountry(code)
  // A country aggregate only exists when the country has more than one region —
  // otherwise the single region's own page is the canonical view.
  if (regions.length < 2) notFound()

  const lang = await getServerLocale((await searchParams)?.lang)
  const t = (key: string) => serverT(lang, key)
  const name = countryName(code)

  const [tier, picks] = await Promise.all([getSubscriptionTier(), getPickedRegions()])
  const locked = countryLockState(tier, regions, picks) === 'locked'

  // Union every member region's spots, de-duplicated by slug, in region order.
  const seen = new Set<string>()
  const points: DetailPoint[] = []
  for (const region of regions) {
    for (const p of getRegionMapPoints(region)) {
      if (seen.has(p.slug)) continue
      seen.add(p.slug)
      points.push({ ...p, href: `/spots/${p.slug}` })
    }
  }

  const agg = getCountryAggregate(code)
  const bounds = agg?.bounds ?? null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/regions/country/${code.toLowerCase()}#itemlist`,
        name,
        numberOfItems: regions.length,
        itemListElement: regions
          .map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            url: `${BASE_URL}/regions/${r.slug}`,
          })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: t('regions.breadcrumb'), item: `${BASE_URL}/regions` },
          { '@type': 'ListItem', position: 3, name, item: `${BASE_URL}/regions/country/${code.toLowerCase()}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="theme-bg flex h-[100dvh] flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <SiteHeader />

        <RegionDetailClient
          name={name}
          subtitle={t('regions.country.subtitle').replace('{country}', name)}
          points={points}
          bounds={bounds}
          locked={locked}
          memberRegions={regions.map(r => ({ slug: r.slug, name: r.name }))}
          countryLink={null}
        />
      </div>
    </>
  )
}

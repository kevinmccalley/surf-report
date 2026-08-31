import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverT } from '@/app/lib/server-t'
import { getServerLocale } from '@/app/lib/server-locale'
import { getSubscriptionTier, getPickedRegions } from '@/app/lib/subscription'
import {
  getSurfRegions,
  getSurfRegionBySlug,
  getSurfRegionsByCountry,
  getRegionMapPoints,
  countryName,
} from '@/app/lib/surf-regions'
import { regionLockState } from '@/app/lib/region-access'
import { CONTINENT_I18N } from '@/app/lib/continents'
import SiteHeader from '@/app/components/SiteHeader'
import RegionDetailClient, { type DetailPoint } from '../RegionDetailClient'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://groundswell.surf'

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ lang?: string }>
}

export function generateStaticParams() {
  return getSurfRegions().map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const region = getSurfRegionBySlug(slug)
  if (!region) return {}

  const lang = await getServerLocale((await searchParams)?.lang)
  const count = region.spotSlugs.length
  const title = `${region.name} — ${serverT(lang, 'regions.meta.title')}`
  const description = `${region.name}: ${count} curated surf breaks mapped together, each with a live forecast on Groundswell.`
  const canonical = `${BASE_URL}/regions/${slug}`
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(region.name)}&subtitle=${encodeURIComponent(description)}`

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

export default async function RegionDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const region = getSurfRegionBySlug(slug)
  if (!region) notFound()

  const lang = await getServerLocale((await searchParams)?.lang)
  const t = (key: string) => serverT(lang, key)

  const [tier, picks] = await Promise.all([getSubscriptionTier(), getPickedRegions()])
  const locked = regionLockState(tier, region, picks) === 'locked'

  const points: DetailPoint[] = getRegionMapPoints(region).map(p => ({
    ...p,
    href: `/spots/${p.slug}`,
  }))

  const siblingRegions = getSurfRegionsByCountry(region.country)
  const countryLink =
    siblingRegions.length > 1
      ? { href: `/regions/country/${region.country.toLowerCase()}`, country: countryName(region.country) }
      : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        '@id': `${BASE_URL}/regions/${slug}#place`,
        name: `${region.name} Surf Region`,
        description: `${region.spotSlugs.length} curated surf breaks in ${region.name}.`,
        url: `${BASE_URL}/regions/${slug}`,
        geo: { '@type': 'GeoCoordinates', latitude: region.center.lat, longitude: region.center.lon },
        containedInPlace: { '@type': 'Country', name: countryName(region.country) },
      },
      {
        '@type': 'ItemList',
        name: t('regions.detail.spotsHeading'),
        numberOfItems: points.length,
        itemListElement: points.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${BASE_URL}${p.href}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: t('regions.breadcrumb'), item: `${BASE_URL}/regions` },
          { '@type': 'ListItem', position: 3, name: region.name, item: `${BASE_URL}/regions/${slug}` },
        ],
      },
    ],
  }

  const subtitle =
    `${t(CONTINENT_I18N[region.continent])} · ${countryName(region.country)}` +
    (region.admin ? ` · ${region.admin}` : '')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="theme-bg flex h-[100dvh] flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <SiteHeader />

        <RegionDetailClient
          name={region.name}
          subtitle={subtitle}
          points={points}
          bounds={region.bounds ?? null}
          locked={locked}
          flagship={region.flagship}
          aliases={region.searchAliases}
          countryLink={countryLink}
          regionSlug={region.slug}
          tier={tier}
          picks={picks}
        />
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverT } from '@/app/lib/server-t'
import { getSubscriptionTier } from '@/app/lib/subscription'
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

  const lang = (await searchParams)?.lang ?? 'en'
  const count = region.spotSlugs.length
  const title = `${region.name} — ${serverT(lang, 'regions.meta.title')}`
  const description = `${region.name}: ${count} curated surf breaks mapped together, each with a live forecast on Groundswell.`
  const canonical = `${BASE_URL}/regions/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: 'Groundswell', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function RegionDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const region = getSurfRegionBySlug(slug)
  if (!region) notFound()

  const lang = (await searchParams)?.lang ?? 'en'
  const t = (key: string) => serverT(lang, key)

  const tier = await getSubscriptionTier()
  const locked = regionLockState(tier, region) === 'locked'

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="theme-bg min-h-screen">
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12" id="main-content">
          <nav aria-label="breadcrumb" className="mb-5 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-200">Groundswell</Link>
            <span className="mx-1">/</span>
            <Link href="/regions" className="transition-colors hover:text-slate-200">{t('regions.breadcrumb')}</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-200">{region.name}</span>
          </nav>

          <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{region.name}</h1>
            {region.flagship && (
              <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-300">
                {t('regions.flagshipBadge')}
              </span>
            )}
          </div>
          <p className="mb-6 text-sm text-slate-400 sm:mb-8">
            {t(CONTINENT_I18N[region.continent])} · {countryName(region.country)}
            {region.admin ? ` · ${region.admin}` : ''}
          </p>

          <RegionDetailClient
            name={region.name}
            points={points}
            bounds={region.bounds ?? null}
            locked={locked}
            aliases={region.searchAliases}
            countryLink={countryLink}
          />

          <div className="mt-10 border-t border-[var(--color-border)] pt-8 sm:mt-14">
            <Link href="/regions" className="text-sm text-slate-400 transition-colors hover:text-slate-200">
              ← {t('regions.detail.backToRegions')}
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

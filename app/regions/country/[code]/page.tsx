import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverT } from '@/app/lib/server-t'
import { getSubscriptionTier } from '@/app/lib/subscription'
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

  const lang = (await searchParams)?.lang ?? 'en'
  const name = countryName(code)
  const title = `${name} — ${serverT(lang, 'regions.meta.title')}`
  const description = serverT(lang, 'regions.country.subtitle').replace('{country}', name)
  const canonical = `${BASE_URL}/regions/country/${code.toLowerCase()}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: 'Groundswell', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CountryAggregatePage({ params, searchParams }: Props) {
  const { code } = await params
  const regions = getSurfRegionsByCountry(code)
  // A country aggregate only exists when the country has more than one region —
  // otherwise the single region's own page is the canonical view.
  if (regions.length < 2) notFound()

  const lang = (await searchParams)?.lang ?? 'en'
  const t = (key: string) => serverT(lang, key)
  const name = countryName(code)

  const tier = await getSubscriptionTier()
  const locked = countryLockState(tier, regions) === 'locked'

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

      <div className="theme-bg min-h-screen">
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12" id="main-content">
          <nav aria-label="breadcrumb" className="mb-5 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-200">Groundswell</Link>
            <span className="mx-1">/</span>
            <Link href="/regions" className="transition-colors hover:text-slate-200">{t('regions.breadcrumb')}</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-200">{name}</span>
          </nav>

          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">{name}</h1>
          <p className="mb-5 text-sm text-slate-400 sm:mb-6">
            {t('regions.country.subtitle').replace('{country}', name)}
          </p>

          {/* Member regions */}
          <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
            {regions.map(r => (
              <Link
                key={r.slug}
                href={`/regions/${r.slug}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-teal-500/40 hover:text-white"
              >
                {r.name}
              </Link>
            ))}
          </div>

          <RegionDetailClient
            name={name}
            points={points}
            bounds={bounds}
            locked={locked}
            countryLink={null}
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

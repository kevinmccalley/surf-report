import type { Metadata } from 'next'
import Link from 'next/link'
import { serverT } from '@/app/lib/server-t'
import { getSubscriptionTier } from '@/app/lib/subscription'
import { getSurfRegions } from '@/app/lib/surf-regions'
import { regionLockState } from '@/app/lib/region-access'
import SiteHeader from '@/app/components/SiteHeader'
import RegionsIndexClient, { type RegionCard } from './RegionsIndexClient'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

type Props = { searchParams?: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = (await searchParams)?.lang ?? 'en'
  const title = serverT(lang, 'regions.meta.title')
  const description = serverT(lang, 'regions.meta.desc')
  const canonical = `${BASE_URL}/regions`

  const languages: Record<string, string> = { 'x-default': canonical }
  for (const locale of LOCALES) {
    languages[locale] = locale === 'en' ? canonical : `${canonical}?lang=${locale}`
  }

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: { title, description, url: canonical, siteName: 'Groundswell', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function RegionsIndexPage({ searchParams }: Props) {
  const lang = (await searchParams)?.lang ?? 'en'
  const t = (key: string) => serverT(lang, key)

  const tier = await getSubscriptionTier()
  const regions = getSurfRegions()

  const cards: RegionCard[] = regions.map(r => ({
    slug: r.slug,
    name: r.name,
    continent: r.continent,
    spotCount: r.spotSlugs.length,
    flagship: !!r.flagship,
    locked: regionLockState(tier, r) === 'locked',
    aliases: r.searchAliases ?? [],
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/regions#itemlist`,
        name: t('regions.heading'),
        description: t('regions.meta.desc'),
        url: `${BASE_URL}/regions`,
        numberOfItems: regions.length,
        itemListElement: [...regions]
          .sort((a, b) => a.name.localeCompare(b.name))
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
            <span className="text-slate-200">{t('regions.breadcrumb')}</span>
          </nav>

          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">{t('regions.heading')}</h1>
          <p className="mb-6 text-sm text-slate-400 sm:mb-10 sm:text-base">{t('regions.subtitle')}</p>

          <RegionsIndexClient regions={cards} />

          <div className="mt-10 border-t border-[var(--color-border)] pt-8 sm:mt-14">
            <Link href="/spots" className="text-sm text-slate-400 transition-colors hover:text-slate-200">
              {t('nav.spots')} →
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

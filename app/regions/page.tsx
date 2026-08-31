import type { Metadata } from 'next'
import Link from 'next/link'
import { serverT } from '@/app/lib/server-t'
import { getServerLocale } from '@/app/lib/server-locale'
import { getSubscriptionTier, getPickedRegions } from '@/app/lib/subscription'
import { getSurfRegions } from '@/app/lib/surf-regions'
import { regionLockState } from '@/app/lib/region-access'
import SiteHeader from '@/app/components/SiteHeader'
import RegionsIndexClient, { type RegionCard } from './RegionsIndexClient'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

type Props = { searchParams?: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = await getServerLocale((await searchParams)?.lang)
  const title = serverT(lang, 'regions.meta.title')
  const description = serverT(lang, 'regions.meta.desc')
  const canonical = `${BASE_URL}/regions`
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}`

  const languages: Record<string, string> = { 'x-default': canonical }
  for (const locale of LOCALES) {
    languages[locale] = locale === 'en' ? canonical : `${canonical}?lang=${locale}`
  }

  return {
    title,
    description,
    alternates: { canonical, languages },
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

export default async function RegionsIndexPage({ searchParams }: Props) {
  const lang = await getServerLocale((await searchParams)?.lang)
  const t = (key: string) => serverT(lang, key)

  const [tier, picks] = await Promise.all([getSubscriptionTier(), getPickedRegions()])
  const regions = getSurfRegions()

  const cards: RegionCard[] = regions.map(r => ({
    slug: r.slug,
    name: r.name,
    continent: r.continent,
    spotCount: r.spotSlugs.length,
    flagship: !!r.flagship,
    locked: regionLockState(tier, r, picks) === 'locked',
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
          <p className="mb-4 text-sm text-slate-400 sm:text-base">{t('regions.subtitle')}</p>

          <Link
            href="/regions/map"
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-sm font-medium text-teal-200 transition-colors hover:border-teal-400/60 hover:bg-teal-500/15 sm:mb-10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3.6 9h16.8M3.6 15h16.8" />
            </svg>
            {t('regions.map.linkCta')}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <RegionsIndexClient regions={cards} tier={tier} initialPicks={picks} />

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

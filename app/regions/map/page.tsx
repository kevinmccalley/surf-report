import type { Metadata } from 'next'
import { serverT } from '@/app/lib/server-t'
import { getServerLocale } from '@/app/lib/server-locale'
import { getSurfRegions } from '@/app/lib/surf-regions'
import { getRegionShapes, getWorldSpots } from '@/app/lib/region-hull'
import SiteHeader from '@/app/components/SiteHeader'
import WorldMapClient from './WorldMapClient'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

type Props = { searchParams?: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = await getServerLocale((await searchParams)?.lang)
  const title = serverT(lang, 'regions.map.meta.title')
  const description = serverT(lang, 'regions.map.meta.desc')
  const canonical = `${BASE_URL}/regions/map`
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

export default async function RegionsMapPage({ searchParams }: Props) {
  const lang = await getServerLocale((await searchParams)?.lang)
  const t = (key: string) => serverT(lang, key)

  const shapes = getRegionShapes()
  const spots = getWorldSpots()
  const regions = getSurfRegions()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/regions/map#itemlist`,
        name: t('regions.map.heading'),
        description: t('regions.map.meta.desc'),
        url: `${BASE_URL}/regions/map`,
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
          { '@type': 'ListItem', position: 3, name: t('regions.map.heading'), item: `${BASE_URL}/regions/map` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="theme-bg flex h-[100dvh] flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <SiteHeader />

        <WorldMapClient
          shapes={shapes}
          spots={spots}
          regionCount={regions.length}
          spotCount={spots.length}
        />
      </div>
    </>
  )
}

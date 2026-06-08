import type { Metadata } from 'next'
import Link from 'next/link'
import { serverT } from '@/app/lib/server-t'
import { getDirectorySpots } from '@/app/lib/spots-directory'
import SpotsDirectoryClient from './SpotsDirectoryClient'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

type Props = { searchParams?: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = (await searchParams)?.lang ?? 'en'
  const title = serverT(lang, 'directory.meta.title')
  const description = serverT(lang, 'directory.meta.desc')
  const canonical = `${BASE_URL}/spots`

  const hreflang: Record<string, string> = { 'x-default': canonical }
  for (const locale of LOCALES) {
    hreflang[locale] = locale === 'en' ? canonical : `${canonical}?lang=${locale}`
  }

  return {
    title,
    description,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Groundswell',
      type: 'website',
      images: [{ url: `/api/og?title=Surf+Spot+Directory&subtitle=220%2B+of+the+world%27s+best+breaks`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SpotsDirectoryPage({ searchParams }: Props) {
  const lang = (await searchParams)?.lang ?? 'en'
  const t = (key: string) => serverT(lang, key)
  const spots = getDirectorySpots()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/spots#itemlist`,
        name: t('directory.heading'),
        description: t('directory.meta.desc'),
        url: `${BASE_URL}/spots`,
        numberOfItems: spots.length,
        itemListElement: [...spots]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((spot, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: spot.name,
            url: `${BASE_URL}/spots/${spot.slug}`,
            item: {
              '@type': 'SportsActivityLocation',
              name: spot.name,
              description: spot.locality,
              geo: {
                '@type': 'GeoCoordinates',
                latitude: spot.lat,
                longitude: spot.lon,
              },
            },
          })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: t('directory.breadcrumb'), item: `${BASE_URL}/spots` },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="theme-bg min-h-screen">
        <header className="theme-header sticky top-0 z-50">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <WaveLogo />
              <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">Groundswell</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-12" id="main-content">
          <nav aria-label="breadcrumb" className="text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-200 transition-colors">Groundswell</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-200">{t('directory.breadcrumb')}</span>
          </nav>

          <h1 className="text-3xl font-bold text-white mb-2">{t('directory.heading')}</h1>
          <p className="text-slate-400 mb-10 text-base">{t('directory.subtitle')}</p>

          <SpotsDirectoryClient spots={spots} />

          <div className="mt-14 pt-8 border-t border-[var(--color-border)]">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              ← {t('nav.backToGroundswell')}
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

function WaveLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M2 18 C6 12, 10 22, 14 16 C18 10, 22 20, 26 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M2 22 C6 16, 10 26, 14 20 C18 14, 22 24, 26 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
    </svg>
  )
}

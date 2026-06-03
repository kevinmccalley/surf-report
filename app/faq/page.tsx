import type { Metadata } from 'next'
import Link from 'next/link'
import { serverT } from '@/app/lib/server-t'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const
const FAQ_COUNT = 8

type Props = { searchParams?: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = (await searchParams)?.lang ?? 'en'
  const title = serverT(lang, 'faq.meta.title')
  const description = serverT(lang, 'faq.meta.desc')
  const canonical = `${BASE_URL}/faq`

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
      images: [{ url: `/api/og?title=Surf+Forecast+FAQ&subtitle=Swell+periods+%C2%B7+wave+height+%C2%B7+reading+a+forecast`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/api/og?title=Surf+Forecast+FAQ&subtitle=Swell+periods+%C2%B7+wave+height+%C2%B7+reading+a+forecast`] },
  }
}

export default async function FaqPage({ searchParams }: Props) {
  const lang = (await searchParams)?.lang ?? 'en'
  const t = (key: string) => serverT(lang, key)

  const questions = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/faq#faqpage`,
        url: `${BASE_URL}/faq`,
        name: t('faq.heading'),
        mainEntity: questions.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: t('faq.breadcrumb'), item: `${BASE_URL}/faq` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="theme-bg min-h-screen">
        <header className="theme-header sticky top-0 z-50">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <WaveLogo />
              <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">Groundswell</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-12" id="main-content">
          <nav aria-label="breadcrumb" className="text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-200 transition-colors">Groundswell</Link>
            <span className="mx-1">/</span>
            <span className="text-slate-200">{t('faq.breadcrumb')}</span>
          </nav>

          <h1 className="text-3xl font-bold text-white mb-2">{t('faq.heading')}</h1>
          <p className="text-slate-400 mb-10 text-base">{t('faq.subtitle')}</p>

          <div className="space-y-8">
            {questions.map(({ q, a }, i) => (
              <section key={i} aria-labelledby={`faq-q${i + 1}`}>
                <h2 id={`faq-q${i + 1}`} className="text-lg font-semibold text-white mb-2">{q}</h2>
                <p className="text-slate-300 leading-relaxed">{a}</p>
              </section>
            ))}
          </div>

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

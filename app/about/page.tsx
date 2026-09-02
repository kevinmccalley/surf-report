import type { Metadata } from 'next'
import AboutContent from './AboutContent'

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

const OG_IMAGE = `/api/og?title=About+Groundswell&subtitle=What+it+is+%C2%B7+where+the+data+comes+from+%C2%B7+who+builds+it`

export function generateMetadata(): Metadata {
  const title = 'About Groundswell — Who Builds It & How the Forecasts Work'
  const description =
    'Groundswell is a surf-forecast service with live conditions and 10-day wave forecasts for any spot on earth, built on Open-Meteo, ECMWF and ERA5 open data by independent developer Kevin McCalley.'
  const canonical = `${BASE_URL}/about`

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
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  }
}

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${BASE_URL}/about#aboutpage`,
        url: `${BASE_URL}/about`,
        name: 'About Groundswell',
        description:
          'Groundswell is a surf-forecast service with live conditions and 10-day wave forecasts for any surf spot on earth, plus historical swell climatology, built on open ocean data.',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        about: { '@id': `${BASE_URL}/#organization` },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE_URL}${OG_IMAGE}` },
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Groundswell',
        url: BASE_URL,
        description:
          'Groundswell provides real-time surf reports, 10-day wave forecasts, and historical surf climatology for any surf spot on earth, powered by ECMWF and ERA5 open ocean data.',
        founder: { '@type': 'Person', name: 'Kevin McCalley' },
        foundingDate: '2026',
        knowsAbout: [
          'Surf forecasting',
          'Ocean wave science',
          'Swell period and direction analysis',
          'Marine meteorology',
          'Tide prediction',
          'ERA5 reanalysis wave data',
          'ECMWF wave models',
          'Surf climatology',
        ],
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/icons/icon-192.png`,
          width: 192,
          height: 192,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@groundswell.surf',
          contactType: 'customer support',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'About', item: `${BASE_URL}/about` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutContent />
    </>
  )
}

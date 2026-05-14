import type { Metadata } from 'next'
import Top100Client from './Top100Client'
import { SPOTS } from './spots-data'

const BASE_URL = 'https://groundswell.surf'

export const metadata: Metadata = {
  title: 'Top 100 Surf Spots in the World — Groundswell',
  description: "Live wave forecasts for the planet's 100 most iconic surf breaks — from Pipeline to Teahupo'o, ranked by region.",
  alternates: { canonical: `${BASE_URL}/top100` },
  openGraph: {
    title: 'Top 100 Surf Spots in the World — Groundswell',
    description: "Live wave forecasts for the planet's 100 most iconic surf breaks, from Pipeline to Teahupo'o.",
    url: `${BASE_URL}/top100`,
    siteName: 'Groundswell',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 100 Surf Spots in the World — Groundswell',
    description: "Live wave forecasts for the planet's 100 most iconic surf breaks.",
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Top 100 Surf Spots in the World',
  description: "The planet's 100 most iconic surf breaks with live wave forecasts.",
  url: `${BASE_URL}/top100`,
  numberOfItems: SPOTS.length,
  itemListElement: SPOTS.map(spot => ({
    '@type': 'ListItem',
    position: spot.rank,
    name: spot.name,
    description: spot.description.slice(0, 200),
    url: `${BASE_URL}/?lat=${spot.lat}&lon=${spot.lon}`,
  })),
}

export default function Top100Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Top100Client />
    </>
  )
}

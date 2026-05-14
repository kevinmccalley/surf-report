import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import ThemeProvider from './components/ThemeProvider'
import { LanguageProvider } from './i18n/LanguageContext'
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://groundswell.surf'),
  title: 'Groundswell — Surf Reports Worldwide',
  description: 'Real-time surf reports and 10-day forecasts for any spot on earth. Wave height, swell, wind, water temperature, and more.',
  keywords: 'surf report, surf forecast, wave height, swell, wind, surf conditions, beach report',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Groundswell',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  alternates: {
    canonical: 'https://groundswell.surf',
  },
  openGraph: {
    title: 'Groundswell — Surf Reports Worldwide',
    description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
    type: 'website',
    url: 'https://groundswell.surf',
    siteName: 'Groundswell',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Groundswell — Surf Reports Worldwide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Groundswell — Surf Reports Worldwide',
    description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020917',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans antialiased">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Groundswell',
              url: 'https://groundswell.surf',
              description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://groundswell.surf/?name={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }) }}
          />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:font-semibold"
          >
            Skip to main content
          </a>
          <LanguageProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </LanguageProvider>
          <ServiceWorkerRegistrar />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}

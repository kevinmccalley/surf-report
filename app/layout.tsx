import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { cookies } from 'next/headers'
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

const VALID_LOCALES = new Set(['en', 'es', 'fr', 'pt-BR', 'pt-PT'])

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('groundswell_locale')?.value ?? 'en'
  const locale = VALID_LOCALES.has(rawLocale) ? rawLocale : 'en'

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning className={inter.variable}>
        <head>
          <link rel="preconnect" href="https://clerk.groundswell.surf" crossOrigin="anonymous" />
        </head>
        <body className="font-sans antialiased">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://groundswell.surf/#website',
                  name: 'Groundswell',
                  url: 'https://groundswell.surf',
                  description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://groundswell.surf/?name={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://groundswell.surf/#app',
                  name: 'Groundswell',
                  applicationCategory: 'SportsApplication',
                  operatingSystem: 'Web, iOS, Android',
                  description: 'Real-time surf reports and 10-day wave forecasts for any surf spot on earth. Covers wave height, swell period and direction, wind, water temperature, and tides.',
                  url: 'https://groundswell.surf',
                  featureList: [
                    'Real-time surf conditions',
                    '10-day wave forecasts',
                    'Swell period and direction analysis',
                    'Wind speed and direction',
                    'Water temperature',
                    'Tide charts',
                    'Historical surf climatology by spot',
                    'Custom spot tracking',
                    'Swell alerts',
                  ],
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free with optional premium subscription',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://groundswell.surf/#organization',
                  name: 'Groundswell',
                  url: 'https://groundswell.surf',
                  description: 'Groundswell provides real-time surf reports, 10-day wave forecasts, and historical surf climatology for any surf spot on earth, powered by ECMWF and NOAA open-ocean data.',
                  knowsAbout: [
                    'Surf forecasting',
                    'Ocean wave science',
                    'Swell period and direction analysis',
                    'Marine meteorology',
                    'Tide prediction',
                    'ERA5 reanalysis wave data',
                    'ECMWF wave models',
                    'NOAA NDBC buoy data',
                    'Surf climatology',
                  ],
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://groundswell.surf/icons/icon-192.png',
                    width: 192,
                    height: 192,
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    email: 'support@groundswell.surf',
                    contactType: 'customer support',
                  },
                },
              ],
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
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '2201970573933439');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src="https://www.facebook.com/tr?id=2201970573933439&ev=PageView&noscript=1"
              alt=""
            />
          </noscript>
        </body>
      </html>
    </ClerkProvider>
  )
}

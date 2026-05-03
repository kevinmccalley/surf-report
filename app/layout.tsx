import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import ThemeProvider from './components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Groundswell — Surf Reports Worldwide',
  description: 'Real-time surf reports and 10-day forecasts for any spot on earth. Wave height, swell, wind, water temperature, and more.',
  keywords: 'surf report, surf forecast, wave height, swell, wind, surf conditions, beach report',
  openGraph: {
    title: 'Groundswell — Surf Reports Worldwide',
    description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
    type: 'website',
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
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:font-semibold"
          >
            Skip to main content
          </a>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

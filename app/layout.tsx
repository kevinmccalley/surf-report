import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
    <html lang="en" className={inter.variable}>
      <body className="bg-ocean-950 text-slate-200 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

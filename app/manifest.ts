import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Groundswell — Surf Reports',
    short_name: 'Groundswell',
    description: 'Real-time surf reports and 10-day forecasts for any spot on earth.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020917',
    theme_color: '#020917',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
    categories: ['weather', 'sports', 'utilities'],
  }
}

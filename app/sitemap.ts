import type { MetadataRoute } from 'next'
import { getAllSpots, slugify } from '@/app/lib/surf-spots'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://groundswell.surf'

  const staticPages = ['/', '/accuracy', '/privacy', '/terms', '/refund', '/support'].map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.5,
  }))

  const climatologyPages = getAllSpots().map(spot => ({
    url: `${base}/climatology/${slugify(spot.name)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...climatologyPages]
}

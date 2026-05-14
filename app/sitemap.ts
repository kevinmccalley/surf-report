import type { MetadataRoute } from 'next'
import { getAllSpots, slugify } from '@/app/lib/surf-spots'
import { getAllSlugs } from '@/app/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const blogSlugs = await getAllSlugs()
  const blogIndex = { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 }
  const blogPosts = blogSlugs.map(slug => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, blogIndex, ...blogPosts, ...climatologyPages]
}

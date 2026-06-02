import type { MetadataRoute } from 'next'
import { getAllSpots, slugify } from '@/app/lib/surf-spots'
import { getAllSlugsWithDate } from '@/app/lib/sanity'

// Dates that don't change with content — pinned to last significant update
const STATIC_LAST_MODIFIED: Record<string, string> = {
  '/': '2026-06-02',
  '/faq': '2026-06-02',
  '/blog': '2026-05-01',
  '/accuracy': '2026-05-01',
  '/privacy': '2026-05-06',
  '/terms': '2026-05-06',
  '/refund': '2026-05-06',
  '/support': '2026-05-06',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://groundswell.surf'

  const staticPages = ['/', '/faq', '/accuracy', '/privacy', '/terms', '/refund', '/support'].map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(STATIC_LAST_MODIFIED[path] ?? '2026-05-01'),
    changeFrequency: 'monthly' as const,
    priority: path === '/' ? 1.0 : 0.5,
  }))

  const climatologyPages = getAllSpots().map(spot => ({
    url: `${base}/climatology/${slugify(spot.name)}`,
    lastModified: new Date('2025-01-01'),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  const blogPostsWithDate = await getAllSlugsWithDate()
  const blogIndex = {
    url: `${base}/blog`,
    lastModified: blogPostsWithDate[0] ? new Date(blogPostsWithDate[0].date) : new Date(STATIC_LAST_MODIFIED['/blog']),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }
  const blogPosts = blogPostsWithDate.map(({ slug, date }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, blogIndex, ...blogPosts, ...climatologyPages]
}

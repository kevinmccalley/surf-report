import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, urlFor, isSanityConfigured } from '@/app/lib/sanity'
import PostCard from '@/app/components/blog/PostCard'

export const revalidate = 60

const BASE_URL = 'https://groundswell.surf'

export const metadata: Metadata = {
  title: 'Surf Reports & Insights — Groundswell',
  description: 'Wave science, forecasting tips, and surf stories from around the world.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Surf Reports & Insights — Groundswell',
    description: 'Wave science, forecasting tips, and surf stories from around the world.',
    url: `${BASE_URL}/blog`,
    siteName: 'Groundswell',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/api/og'] },
}

export default async function BlogIndex() {
  const posts = await getAllPosts()

  const featuredPost   = posts.find(p => p.featured) ?? posts[0] ?? null
  const remainingPosts = featuredPost ? posts.filter(p => p._id !== featuredPost._id) : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Groundswell Blog',
    url: `${BASE_URL}/blog`,
    description: 'Wave science, forecasting tips, and surf stories from around the world.',
    blogPost: posts.slice(0, 10).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${BASE_URL}/blog/${p.slug.current}`,
      datePublished: p.publishedAt,
      author: { '@type': 'Person', name: p.author?.name },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-3">
            Surf Reports & Insights
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-[var(--color-text-secondary)]">
              Wave science, forecasting tips, and surf stories from around the world.
            </p>
            <Link
              href="/blog/rss.xml"
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
              </svg>
              Subscribe via RSS
            </Link>
          </div>
        </div>

        {/* No posts state */}
        {!isSanityConfigured || posts.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-muted)]">
            <p className="text-lg">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPost && (
              <PostCard
                post={featuredPost}
                featured
                coverSrc={featuredPost.coverImage?.asset
                  ? urlFor(featuredPost.coverImage.asset).width(1200).height(630).auto('format').quality(85).url()
                  : null}
              />
            )}
            {remainingPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                coverSrc={post.coverImage?.asset
                  ? urlFor(post.coverImage.asset).width(600).height(340).auto('format').quality(85).url()
                  : null}
              />
            ))}
          </div>
        )}

        {/* Back home */}
        <div className="mt-14 pt-8 border-t border-[var(--color-border)]">
          <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-sky-400 transition-colors">
            ← Back to Groundswell
          </Link>
        </div>
      </main>
    </>
  )
}

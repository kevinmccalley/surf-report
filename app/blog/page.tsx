import type { Metadata } from 'next'
import { getAllPosts, urlFor, isSanityConfigured } from '@/app/lib/sanity'
import PostCard from '@/app/components/blog/PostCard'
import BlogHeader from '@/app/components/blog/BlogHeader'
import BlogBackLink, { BlogNoPostsMessage } from '@/app/components/blog/BlogBackLink'

export const revalidate = 60

const BASE_URL = 'https://groundswell.surf'
const LOCALES = ['en', 'es', 'fr', 'pt-BR', 'pt-PT'] as const

const blogHreflang: Record<string, string> = { 'x-default': `${BASE_URL}/blog` }
for (const locale of LOCALES) {
  blogHreflang[locale] = locale === 'en' ? `${BASE_URL}/blog` : `${BASE_URL}/blog?lang=${locale}`
}

const TITLE = 'Surf Reports & Insights — Groundswell'
const DESCRIPTION = 'Wave science, forecasting tips, and surf stories from around the world.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/blog`, languages: blogHreflang },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/blog`,
    siteName: 'Groundswell',
    images: [{ url: '/api/og?title=Surf+Reports+%26+Insights&subtitle=Wave+science%2C+forecasting+tips%2C+and+surf+stories', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/api/og?title=Surf+Reports+%26+Insights&subtitle=Wave+science%2C+forecasting+tips%2C+and+surf+stories'] },
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
        <BlogHeader />

        {/* No posts state */}
        {!isSanityConfigured || posts.length === 0 ? (
          <BlogNoPostsMessage />
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
          <BlogBackLink />
        </div>
      </main>
    </>
  )
}

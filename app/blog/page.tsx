import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts, urlFor, isSanityConfigured } from '@/app/lib/sanity'
import type { SanityPost } from '@/app/lib/sanity'

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function PostCard({ post, featured = false }: { post: SanityPost; featured?: boolean }) {
  const coverSrc = post.coverImage?.asset
    ? urlFor(post.coverImage.asset)
        .width(featured ? 1200 : 600)
        .height(featured ? 630 : 340)
        .auto('format')
        .quality(85)
        .url()
    : null

  if (featured) {
    return (
      <Link href={`/blog/${post.slug.current}`} className="group block col-span-full">
        <article className="relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-sky-500/50 transition-colors">
          {coverSrc && (
            <div className="relative w-full aspect-[2/1]">
              <Image src={coverSrc} alt={post.coverImage?.alt ?? ''} fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          )}
          <div className={`${coverSrc ? 'absolute bottom-0 left-0 right-0' : ''} p-6 md:p-8`}>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-400/10 rounded-full px-3 py-1">
                Featured
              </span>
              {post.categories?.slice(0, 2).map(c => (
                <span key={c.slug.current} className="text-xs text-white/70 bg-white/10 rounded-full px-3 py-1">
                  {c.title}
                </span>
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-sky-300 transition-colors leading-tight mb-2">
              {post.title}
            </h2>
            <p className="text-white/70 text-base line-clamp-2 mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-sm text-white/50">
              {post.author && <span>By {post.author.name}</span>}
              {post.publishedAt && <><span>·</span><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></>}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug.current}`} className="group block">
      <article className="h-full rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-sky-500/50 transition-colors flex flex-col">
        {coverSrc && (
          <div className="relative w-full aspect-[16/9] shrink-0">
            <Image src={coverSrc} alt={post.coverImage?.alt ?? ''} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.categories.slice(0, 2).map(c => (
                <span key={c.slug.current} className="text-xs text-sky-400 bg-sky-400/10 rounded-full px-2.5 py-0.5">
                  {c.title}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:text-sky-400 transition-colors leading-snug mb-2">
            {post.title}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 flex-1 mb-4">{post.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mt-auto">
            <span>{post.author?.name ?? ''}</span>
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function BlogIndex() {
  const posts = await getAllPosts()
  const [featured, ...rest] = posts.filter(p => p.featured).concat(posts.filter(p => !p.featured))
    .slice(0, 1).concat(posts.filter(p => !p.featured).concat(posts.filter(p => p.featured)).slice(1))

  // Simpler: featured post first, then the rest
  const featuredPost = posts.find(p => p.featured) ?? posts[0] ?? null
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
            {/* Featured post spans full width */}
            {featuredPost && <PostCard post={featuredPost} featured />}
            {/* Remaining posts in grid */}
            {remainingPosts.map(post => (
              <PostCard key={post._id} post={post} />
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

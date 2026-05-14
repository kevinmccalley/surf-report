import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { getPostBySlug, getAllSlugs, urlFor } from '@/app/lib/sanity'
import { portableTextComponents } from '@/app/components/blog/PortableTextComponents'

export const revalidate = 60

const BASE_URL = 'https://groundswell.surf'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Groundswell Blog' }

  const title = post.seoTitle ?? `${post.title} — Groundswell Blog`
  const description = post.seoDescription ?? post.excerpt
  const canonical = `${BASE_URL}/blog/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Groundswell',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: '/api/og', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/api/og'] },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const coverSrc = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).auto('format').quality(85).url()
    : null

  const avatarSrc = post.author?.avatar?.asset
    ? urlFor(post.author.avatar.asset).width(80).height(80).auto('format').url()
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${BASE_URL}/blog/${slug}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
    image: coverSrc ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Groundswell',
      url: BASE_URL,
    },
    keywords: post.categories?.map(c => c.title).join(', '),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
          <Link href="/" className="hover:text-sky-400 transition-colors">Groundswell</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-sky-400 transition-colors">Blog</Link>
          <span>›</span>
          <span className="text-[var(--color-text-secondary)] truncate">{post.title}</span>
        </nav>

        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(c => (
              <span key={c.slug.current} className="text-xs font-medium text-sky-400 bg-sky-400/10 rounded-full px-3 py-1">
                {c.title}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
          {post.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-3 mb-8">
          {avatarSrc && (
            <Image
              src={avatarSrc}
              alt={post.author?.avatar?.alt ?? post.author?.name ?? ''}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          )}
          <div className="text-sm text-[var(--color-text-secondary)]">
            {post.author && <span className="font-medium text-[var(--color-text-primary)]">{post.author.name}</span>}
            {post.author?.role && <span className="text-[var(--color-text-muted)]"> · {post.author.role}</span>}
            {post.publishedAt && (
              <>
                <span className="text-[var(--color-text-muted)]"> · </span>
                <time dateTime={post.publishedAt} className="text-[var(--color-text-muted)]">
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        {coverSrc && (
          <figure className="mb-10">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
              <Image
                src={coverSrc}
                alt={post.coverImage?.alt ?? ''}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-cover"
              />
            </div>
            {post.coverImage?.caption && (
              <figcaption className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
                {post.coverImage.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Body */}
        <article className="prose-invert max-w-none">
          {post.body && <PortableText value={post.body} components={portableTextComponents} />}
        </article>

        {/* Email CTA */}
        <div className="mt-14 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Get weekly swell alerts</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Subscribe for surf forecasts and new articles.</p>
          <Link
            href="/"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Get started free →
          </Link>
        </div>

        {/* Footer nav */}
        <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
          <Link href="/blog" className="text-sm text-[var(--color-text-muted)] hover:text-sky-400 transition-colors">
            ← Back to blog
          </Link>
        </div>
      </main>
    </>
  )
}

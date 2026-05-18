'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { portableTextComponents } from '@/app/components/blog/PortableTextComponents'
import { findSpotBySlug } from '@/app/lib/surf-spots'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { SanityPost, PostTranslations } from '@/app/lib/sanity'
import type { Locale } from '@/app/i18n/LanguageContext'

// Map locale codes → Sanity field keys (no hyphens allowed in field names)
function translationKey(locale: Locale): keyof PostTranslations | null {
  const map: Partial<Record<Locale, keyof PostTranslations>> = {
    es: 'es', fr: 'fr', 'pt-BR': 'ptBR', 'pt-PT': 'ptPT',
  }
  return map[locale] ?? null
}

function formatDate(dateStr: string, bcp47: string) {
  return new Date(dateStr).toLocaleDateString(bcp47, { year: 'numeric', month: 'long', day: 'numeric' })
}

interface Props {
  post: SanityPost
  coverSrc: string | null
  avatarSrc: string | null
}

export default function BlogPostContent({ post, coverSrc, avatarSrc }: Props) {
  const { locale, bcp47 } = useLanguage()

  const key = translationKey(locale)
  const tx  = key ? post.translations?.[key] : undefined

  const title   = tx?.title   ?? post.title
  const excerpt = tx?.excerpt ?? post.excerpt
  const body    = tx?.body    ?? post.body

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
        <Link href="/" className="hover:text-sky-400 transition-colors">Groundswell</Link>
        <span>›</span>
        <Link href="/blog" className="hover:text-sky-400 transition-colors">Blog</Link>
        <span>›</span>
        <span className="text-[var(--color-text-secondary)] truncate">{title}</span>
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
        {title}
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
                {formatDate(post.publishedAt, bcp47)}
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
        {body && <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />}
      </article>

      {/* Tagged surf spots → climatology links */}
      {post.surfSpots && post.surfSpots.length > 0 && (() => {
        const spots = post.surfSpots!
          .map(slug => ({ slug, spot: findSpotBySlug(slug) }))
          .filter(({ spot }) => spot != null)
        return spots.length > 0 ? (
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
              Check conditions at {spots.length === 1 ? 'this spot' : 'these spots'}
            </p>
            <div className="flex flex-col gap-2">
              {spots.map(({ slug, spot }) => (
                <Link
                  key={slug}
                  href={`/climatology/${slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-sky-500/40 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-sky-400 transition-colors">
                      {spot!.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{spot!.country}</p>
                  </div>
                  <span className="text-xs text-sky-400 whitespace-nowrap">Swell history →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null
      })()}

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
  )
}

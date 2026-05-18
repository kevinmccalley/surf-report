'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { SanityPost, PostTranslations } from '@/app/lib/sanity'
import type { Locale } from '@/app/i18n/LanguageContext'

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
  featured?: boolean
  coverSrc: string | null
}

export default function PostCard({ post, featured = false, coverSrc }: Props) {
  const { locale, bcp47 } = useLanguage()

  const key = translationKey(locale)
  const tx  = key ? post.translations?.[key] : undefined

  const title   = tx?.title   ?? post.title
  const excerpt = tx?.excerpt ?? post.excerpt

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
              {title}
            </h2>
            <p className="text-white/70 text-base line-clamp-2 mb-4">{excerpt}</p>
            <div className="flex items-center gap-3 text-sm text-white/50">
              {post.author && <span>By {post.author.name}</span>}
              {post.publishedAt && (
                <><span>·</span><time dateTime={post.publishedAt}>{formatDate(post.publishedAt, bcp47)}</time></>
              )}
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
            {title}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 flex-1 mb-4">{excerpt}</p>
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mt-auto">
            <span>{post.author?.name ?? ''}</span>
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, bcp47)}</time>}
          </div>
        </div>
      </article>
    </Link>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, urlFor, resolvePostLocale } from '@/app/lib/sanity'
import { findSpotBySlug, slugify } from '@/app/lib/surf-spots'
import BlogPostContent from '@/app/components/blog/BlogPostContent'

// ISR: build on first request, refresh every 60 seconds — no static pre-generation needed.
export const revalidate = 60

const BASE_URL = 'https://groundswell.surf'

// Site locale code → OG / BCP-47 tags.
const OG_LOCALE: Record<string, string> = {
  en: 'en_US', es: 'es_ES', fr: 'fr_FR', 'pt-BR': 'pt_BR', 'pt-PT': 'pt_PT',
}
const BCP47: Record<string, string> = {
  en: 'en', es: 'es', fr: 'fr', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT',
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ lang?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Groundswell Blog' }

  const { lang, tx, available } = resolvePostLocale(post, (await searchParams)?.lang)

  const displayTitle = tx?.title ?? post.title
  const title       = tx?.seoTitle ?? post.seoTitle ?? `${displayTitle} — Groundswell Blog`
  const description = tx?.seoDescription ?? tx?.excerpt ?? post.seoDescription ?? post.excerpt

  const base      = `${BASE_URL}/blog/${slug}`
  const canonical = lang === 'en' ? base : `${base}?lang=${lang}`

  // hreflang cluster — only the languages this post actually has.
  const languages: Record<string, string> = { 'x-default': base, en: base }
  for (const l of available) languages[l] = `${base}?lang=${l}`

  const ogImageUrl = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).auto('format').quality(85).url()
    : `${BASE_URL}/api/og?title=${encodeURIComponent(displayTitle)}&subtitle=${encodeURIComponent(tx?.excerpt ?? post.excerpt ?? 'Groundswell Blog')}`

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title, description, url: canonical, siteName: 'Groundswell', type: 'article',
      locale: OG_LOCALE[lang],
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.coverImage?.alt ?? displayTitle }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
  }
}

export default async function BlogPost({ params, searchParams }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const { lang, tx } = resolvePostLocale(post, (await searchParams)?.lang)
  const headline = tx?.title ?? post.title
  const summary  = tx?.excerpt ?? post.excerpt

  const coverSrc = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).auto('format').quality(85).url()
    : null

  const avatarSrc = post.author?.avatar?.asset
    ? urlFor(post.author.avatar.asset).width(80).height(80).auto('format').url()
    : null

  const mentionedSpots = (post.surfSpots ?? [])
    .map(s => findSpotBySlug(s))
    .filter(Boolean)

  const graph: object[] = [
    {
      '@type': 'BlogPosting',
      headline,
      description: summary,
      inLanguage: BCP47[lang],
      url: lang === 'en' ? `${BASE_URL}/blog/${slug}` : `${BASE_URL}/blog/${slug}?lang=${lang}`,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt ?? post.publishedAt,
      author: post.author ? {
        '@type': 'Person',
        name: post.author.name,
        jobTitle: post.author.role ?? undefined,
        description: post.author.credentials ?? post.author.bio ?? undefined,
        image: avatarSrc ?? undefined,
      } : undefined,
      image: coverSrc ?? undefined,
      publisher: {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Groundswell',
        url: BASE_URL,
      },
      keywords: post.categories?.map(c => c.title).join(', '),
      about: post.categories?.map(c => ({ '@type': 'Thing', name: c.title })),
      mentions: mentionedSpots.length ? mentionedSpots.map(s => ({
        '@type': 'Place',
        name: `${s!.name}, ${s!.country}`,
        url: `${BASE_URL}/climatology/${slugify(s!.name)}`,
        geo: { '@type': 'GeoCoordinates', latitude: s!.lat, longitude: s!.lon },
      })) : undefined,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: headline, item: `${BASE_URL}/blog/${slug}` },
      ],
    },
  ]

  if (post.isHowTo && post.howToSteps?.length) {
    graph.push({
      '@type': 'HowTo',
      name: headline,
      description: summary,
      step: post.howToSteps.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text ?? s.name,
      })),
    })
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPostContent post={post} coverSrc={coverSrc} avatarSrc={avatarSrc} />
    </>
  )
}

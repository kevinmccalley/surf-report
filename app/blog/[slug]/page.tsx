import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllSlugs, urlFor } from '@/app/lib/sanity'
import BlogPostContent from '@/app/components/blog/BlogPostContent'

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

  const title       = post.seoTitle ?? `${post.title} — Groundswell Blog`
  const description = post.seoDescription ?? post.excerpt
  const canonical   = `${BASE_URL}/blog/${slug}`

  const ogImageUrl = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).auto('format').quality(85).url()
    : `${BASE_URL}/api/og`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, siteName: 'Groundswell', type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.coverImage?.alt ?? title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
  }
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
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        url: `${BASE_URL}/blog/${slug}`,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
        image: coverSrc ?? undefined,
        publisher: { '@type': 'Organization', name: 'Groundswell', url: BASE_URL },
        keywords: post.categories?.map(c => c.title).join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Groundswell', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${BASE_URL}/blog/${slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPostContent post={post} coverSrc={coverSrc} avatarSrc={avatarSrc} />
    </>
  )
}

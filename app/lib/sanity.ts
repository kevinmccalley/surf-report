import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = '2025-05-14'

export const isSanityConfigured = Boolean(projectId)

export const sanityClient = createClient({
  projectId: projectId || 'unconfigured',
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN,
})

const builder = imageUrlBuilder(sanityClient)
export type SanityImageSource = Parameters<typeof builder.image>[0]
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// ── TypeScript interfaces ──────────────────────────────────────────────────

export interface PostTranslation {
  title?: string
  excerpt?: string
  body?: unknown[]
  seoTitle?: string
  seoDescription?: string
}

export interface PostTranslations {
  es?: PostTranslation
  fr?: PostTranslation
  ptBR?: PostTranslation
  ptPT?: PostTranslation
}

export interface SanityPost {
  _id: string
  _createdAt: string
  _updatedAt?: string
  title: string
  slug: { current: string }
  excerpt: string
  publishedAt?: string
  featured?: boolean
  coverImage?: {
    asset: SanityImageSource
    alt?: string
    caption?: string
  }
  author?: {
    name: string
    slug: { current: string }
    role?: string
    bio?: string
    avatar?: { asset: SanityImageSource; alt?: string }
  }
  categories?: Array<{ title: string; slug: { current: string } }>
  body?: unknown[]
  seoTitle?: string
  seoDescription?: string
  surfSpots?: string[]
  translations?: PostTranslations
}

export interface SanityPostStub {
  title: string
  slug: string
  excerpt: string
  publishedAt?: string
  coverImage?: { asset: SanityImageSource; alt?: string }
}

// ── GROQ queries ──────────────────────────────────────────────────────────

export const ALL_POSTS_QUERY = `
  *[_type == "post"
    && !(_id in path("drafts.**"))
    && defined(publishedAt)
    && publishedAt <= now()
  ] | order(featured desc, publishedAt desc) {
    _id, _createdAt, title, slug, excerpt, publishedAt, featured,
    coverImage { asset, alt, caption },
    author->{ name, slug, role, avatar { asset, alt } },
    categories[]->{ title, slug },
    translations {
      es { title, excerpt },
      fr { title, excerpt },
      ptBR { title, excerpt },
      ptPT { title, excerpt }
    }
  }
`

export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug][0] {
    _id, _createdAt, _updatedAt, title, slug, excerpt, publishedAt, featured,
    coverImage { asset, alt, caption },
    author->{ name, slug, role, bio, avatar { asset, alt } },
    categories[]->{ title, slug },
    body,
    seoTitle, seoDescription,
    surfSpots,
    translations {
      es { title, excerpt, body, seoTitle, seoDescription },
      fr { title, excerpt, body, seoTitle, seoDescription },
      ptBR { title, excerpt, body, seoTitle, seoDescription },
      ptPT { title, excerpt, body, seoTitle, seoDescription }
    }
  }
`

export const POSTS_FOR_SPOT_QUERY = `
  *[_type == "post"
    && !(_id in path("drafts.**"))
    && defined(publishedAt)
    && publishedAt <= now()
    && $slug in surfSpots
  ] | order(publishedAt desc) [0..2] {
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    coverImage { asset, alt }
  }
`

export const ALL_SLUGS_QUERY = `
  *[_type == "post"
    && !(_id in path("drafts.**"))
    && defined(publishedAt)
    && publishedAt <= now()
  ].slug.current
`

export const ALL_SLUGS_WITH_DATE_QUERY = `
  *[_type == "post"
    && !(_id in path("drafts.**"))
    && defined(publishedAt)
    && publishedAt <= now()
  ] | order(publishedAt desc) {
    "slug": slug.current,
    "date": coalesce(_updatedAt, publishedAt)
  }
`

// ── Fetch helpers ──────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<SanityPost[]> {
  if (!isSanityConfigured) return []
  try {
    return await sanityClient.fetch<SanityPost[]>(ALL_POSTS_QUERY, {}, { next: { revalidate: 60 } })
  } catch {
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  if (!isSanityConfigured) return null
  try {
    return await sanityClient.fetch<SanityPost>(POST_BY_SLUG_QUERY, { slug }, { next: { revalidate: 60 } })
  } catch {
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  if (!isSanityConfigured) return []
  try {
    return await sanityClient.fetch<string[]>(ALL_SLUGS_QUERY, {}, { next: { revalidate: 3600 } })
  } catch {
    return []
  }
}

export async function getPostsForSpot(slug: string): Promise<SanityPostStub[]> {
  if (!isSanityConfigured) return []
  try {
    return await sanityClient.fetch<SanityPostStub[]>(
      POSTS_FOR_SPOT_QUERY,
      { slug },
      { next: { revalidate: 3600 } },
    )
  } catch {
    return []
  }
}

export async function getAllSlugsWithDate(): Promise<Array<{ slug: string; date: string }>> {
  if (!isSanityConfigured) return []
  try {
    return await sanityClient.fetch<Array<{ slug: string; date: string }>>(
      ALL_SLUGS_WITH_DATE_QUERY,
      {},
      { next: { revalidate: 3600 } },
    )
  } catch {
    return []
  }
}

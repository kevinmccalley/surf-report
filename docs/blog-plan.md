# Groundswell Blog — Implementation Plan

## Overview
A Sanity CMS-powered blog at `groundswell.surf/blog`, with an embedded Sanity Studio at `groundswell.surf/studio`. Laura authors posts in English via the Studio UI; blog UI chrome is fully translated across all 5 Groundswell locales. Built with `next-sanity`, `@portabletext/react`, and `@sanity/image-url` inside the existing Next.js 16 App Router project.

---

## Manual Setup (User) — Do First

Before the studio or blog will function, complete these steps at sanity.io:

1. Create a new project — name it **"Groundswell Blog"**, dataset: `production`
2. Copy the **Project ID** (visible in project settings)
3. Go to **API → Tokens** → create a token named "Groundswell ISR Read" with **Viewer** role
4. Go to **API → CORS Origins** → add:
   - `https://groundswell.surf`
   - `https://dev.groundswell.surf`
   - `http://localhost:3000`
5. Add to `.env.local` and Vercel environment variables (both `dev` and `prod`):

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=your_read_token_here
```

---

## Packages Installed

```
npm install next-sanity sanity @sanity/image-url @portabletext/react
```

---

## Architecture

```
groundswell.surf/
├── /blog                     → public blog index (all posts, featured hero)
├── /blog/[slug]              → public post detail (Portable Text body)
├── /blog/rss.xml             → RSS 2.0 feed
└── /studio                   → Sanity Studio (Clerk-protected, admin only)
```

**ISR**: Blog pages revalidate every 60 seconds (`export const revalidate = 60`). No need for webhooks for now — posts go live within a minute of publishing.

---

## Files Created

### Sanity Schema (`sanity/schemas/`)

| File | Purpose |
|---|---|
| `index.ts` | Exports all schema types |
| `post.ts` | Blog post — title, slug, excerpt, coverImage, author ref, categories, body, SEO group, settings group |
| `author.ts` | Author — name, slug, role, bio, avatar |
| `category.ts` | Category — title, slug, description |
| `blockContent.ts` | Portable Text blocks — paragraphs, H2–H4, blockquote, links, inline images, code blocks, callouts |

### Sanity Studio Config

| File | Purpose |
|---|---|
| `sanity.config.ts` (root) | Studio config — schema, structure sidebar (Posts / Authors / Categories), visionTool |
| `app/studio/[[...tool]]/page.tsx` | Embedded NextStudio page — force-dynamic, client component |

### Sanity Client (`app/lib/sanity.ts`)

- `sanityClient` — `createClient` with projectId, dataset, apiVersion `2025-05-14`, `useCdn: true`
- `urlFor(source)` — `@sanity/image-url` builder
- `isSanityConfigured` — boolean guard; all fetch calls no-op gracefully when env vars missing
- GROQ queries: `ALL_POSTS_QUERY`, `POST_BY_SLUG_QUERY`, `ALL_SLUGS_QUERY`
- `SanityPost` TypeScript interface

### Blog Routes

| File | Purpose |
|---|---|
| `app/blog/layout.tsx` | Thin layout wrapper; inherits root providers |
| `app/blog/page.tsx` | Index — featured hero + 3-col grid; JSON-LD Blog schema; `revalidate = 60` |
| `app/blog/[slug]/page.tsx` | Post detail — cover image, body, author, categories, breadcrumb, email CTA; JSON-LD BlogPosting; `revalidate = 60` |
| `app/blog/rss.xml/route.ts` | RSS 2.0 Route Handler |

### Portable Text

| File | Purpose |
|---|---|
| `app/components/blog/PortableTextComponents.tsx` | Custom React renderers for all block types (headings, blockquote, links, images via next/image, code blocks, callouts) |

### Documentation

| File | Audience |
|---|---|
| `docs/groundswell-blog-guide.md` | Laura — step-by-step Studio usage guide (surf-specific) |
| `docs/blog-plan.md` | This file |

---

## Files Modified

| File | Change |
|---|---|
| `middleware.ts` | Protect `/studio` — require Clerk session |
| `app/sitemap.ts` | Add `/blog` + all post slugs |
| `app/i18n/messages/en.ts` (+ 4 others) | Add `blog.*` keys |
| `app/components/SurfApp.tsx` | Add Blog nav link |
| `E:\projects\web-accessibility\BRIDGETTE_BRIEFING.md` | Note Groundswell blog is live at groundswell.surf/studio |

---

## i18n Keys Added (`blog.*`)

```ts
'blog.nav': 'Blog',
'blog.heading': 'Surf Reports & Insights',
'blog.subtitle': 'Wave science, forecasting tips, and surf stories from around the world.',
'blog.readMore': 'Read article',
'blog.backToBlog': '← Back to blog',
'blog.by': 'By',
'blog.postedOn': 'Posted',
'blog.categories': 'Topics',
'blog.featuredPost': 'Featured',
'blog.noPostsYet': 'No posts yet — check back soon.',
'blog.rssLink': 'Subscribe via RSS',
'blog.emailCta.heading': 'Get weekly swell alerts',
'blog.emailCta.body': 'Subscribe for surf forecasts and new articles.',
```

---

## Starter Categories (seed manually in Studio)

| Title | Slug | Use for |
|---|---|---|
| Wave Science | `wave-science` | How swells form, travel, break |
| Forecasting Tips | `forecasting-tips` | Reading and using forecasts |
| Surf Spots | `surf-spots` | Featured breaks worldwide |
| Gear & Equipment | `gear-equipment` | Boards, wetsuits, accessories |
| Groundswell Updates | `groundswell-updates` | Product news, feature announcements |
| Surf Culture | `surf-culture` | Lifestyle, travel, community |

---

## SEO

- `generateMetadata()` on both blog pages — title, description, OG, Twitter card
- Blog index title: `Surf Reports & Insights — Groundswell`
- Post title: `${post.title} — Groundswell Blog`
- OG image: `/api/og` (existing dynamic route)
- JSON-LD: `Blog` on index, `BlogPosting` on post detail
- Canonical URLs on all pages
- Blog index + all posts in sitemap

---

## Implementation Order

- [x] Write this plan doc
- [ ] Install packages (`next-sanity`, `sanity`, `@sanity/image-url`, `@portabletext/react`)
- [ ] `sanity/schemas/` — 4 schema files + index
- [ ] `sanity.config.ts` — studio config
- [ ] `app/studio/[[...tool]]/page.tsx` — embedded studio
- [ ] Protect `/studio` in `middleware.ts`
- [ ] `app/lib/sanity.ts` — client, GROQ, types
- [ ] `app/components/blog/PortableTextComponents.tsx`
- [ ] `app/blog/layout.tsx`
- [ ] `app/blog/page.tsx` — index
- [ ] `app/blog/[slug]/page.tsx` — post detail
- [ ] `app/blog/rss.xml/route.ts`
- [ ] Add `blog.*` i18n keys to all 5 locale files
- [ ] Add Blog nav link in `SurfApp.tsx`
- [ ] Update `app/sitemap.ts`
- [ ] Create `docs/groundswell-blog-guide.md` for Laura
- [ ] Update `BRIDGETTE_BRIEFING.md` in AccessBridge project
- [ ] User adds Sanity env vars → confirm studio loads at `/studio`
- [ ] Seed Categories + first Author in Studio
- [ ] Create first test post → verify blog index and post detail render

---

## Verification Checklist

1. `npm run build` — no type errors, studio page compiles
2. `/studio` — Sanity Studio loads; unauthenticated → redirect to Clerk sign-in
3. Create test post in Studio with all fields
4. `/blog` — test post appears in grid
5. `/blog/[slug]` — body renders (headings, images, callouts, code blocks)
6. `/blog/rss.xml` — valid RSS with test post
7. `/sitemap.xml` — blog post URL present
8. Switch language — UI chrome updates; post content stays English
9. `<title>` correct in DevTools on both blog pages

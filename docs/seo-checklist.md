# Groundswell SEO & GEO Checklist

Last audited: 2026-06-02. Run `/seo audit` any time to refresh.

## Critical

- [x] **#1 — `html lang` hardcoded to `"en"`**
  Root layout always renders `<html lang="en">` regardless of user locale. Fixed by writing a
  locale cookie in `LanguageProvider` and reading it server-side in `layout.tsx`.

## High

- [x] **#2 — No `SoftwareApplication` schema**
  AI engines (Perplexity, ChatGPT search, Google AI Overviews) need to understand what Groundswell
  IS. Added `SoftwareApplication` node to the root `@graph` in `layout.tsx`.

- [ ] **#3 — No FAQ schema**
  Biggest GEO opportunity remaining. Surfing vocabulary ("what is swell period?", "how is wave
  height measured?") maps perfectly to FAQ schema that AI engines extract for direct answers.
  Candidates: a `/faq` page, the blog, and the home page footer.

- [x] **#4 — hreflang missing on home page default state + static pages**
  Home page `/` (no spot selected) had no `alternates.languages`. Blog index also missing.
  Fixed both. Remaining static pages (`/accuracy`, `/terms`, `/privacy`, `/refund`, `/support`)
  are low-traffic utility pages — add hreflang if they get translated content.

- [ ] **#5 — `dateModified` on BlogPosting always equals `publishedAt`**
  Sanity exposes `_updatedAt` on every document. Wire it through `getAllSlugsWithDate` and
  `getPostBySlug` queries, then use it as `dateModified` in the BlogPosting schema.

- [ ] **#6 — Blog index page missing `twitter.title`, `twitter.description`, OG `alt`**
  Minor but easy — three fields missing from `app/blog/page.tsx` metadata export.

## Medium

- [x] **#8 — `robots.ts` allows everything including `/api/`, `/sign-in`, `/studio/`**
  Added `disallow` rules for API routes, auth pages, Sanity Studio, and debug endpoints.

- [ ] **#7 — No `BreadcrumbList` on climatology pages**
  Blog posts have breadcrumbs; spot climatology pages (`/climatology/[slug]`) don't. Add the
  same `BreadcrumbList` pattern: Home → Climatology → [Spot Name].

- [ ] **#9 — No `sameAs` on Organization schema**
  Social profile URLs (Twitter/X, Instagram) on the `Organization` node boost entity clarity
  for Google Knowledge Graph and AI engines. Add when social handles are confirmed.

## Low

- [ ] **#10 — `keywords` meta tag in root layout**
  Google ignores it. Harmless dead weight — remove on next layout touch.

- [ ] **#11 — Sitemap `STATIC_LAST_MODIFIED` dates are hardcoded**
  Minor freshness signal issue. Low impact; update when static pages change.

---

## GEO Roadmap (AI Search — future work)

- [ ] FAQ page (`/faq`) with FAQ schema — surf conditions vocabulary
- [ ] HowTo schema on blog posts that describe processes ("How to read a swell forecast")
- [ ] E-E-A-T improvements: author bios with credentials, citations on data sources
- [ ] `sameAs` links on Organization once social profiles are active
- [ ] `mentions` and `about` fields on BlogPosting for entity linking
- [ ] Structured answer blocks in blog content (short, citable paragraphs for AI extraction)

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

- [x] **#3 — No FAQ schema**
  Created `/faq` with 8 surf-vocabulary Q&As (swell period, Hs, offshore wind, groundswell vs
  wind swell, reading a forecast, climatology, wave measurement, good surf day). FAQPage +
  BreadcrumbList JSON-LD, hreflang for all 5 locales, fully SSR'd. Linked from footer nav.

- [x] **#4 — hreflang missing on home page default state + static pages**
  Home page `/` (no spot selected) had no `alternates.languages`. Blog index also missing.
  Fixed both. Remaining static pages (`/accuracy`, `/terms`, `/privacy`, `/refund`, `/support`)
  are low-traffic utility pages — add hreflang if they get translated content.

- [x] **#5 — `dateModified` on BlogPosting always equals `publishedAt`**
  Added `_updatedAt` to `SanityPost` interface and `POST_BY_SLUG_QUERY`. BlogPosting now uses
  `post._updatedAt ?? post.publishedAt` for `dateModified`.

- [x] **#6 — Blog index page missing `twitter.title`, `twitter.description`, OG `alt`**
  Fixed as part of #4 — all three fields added to `app/blog/page.tsx` metadata export.

## Medium

- [x] **#8 — `robots.ts` allows everything including `/api/`, `/sign-in`, `/studio/`**
  Added `disallow` rules for API routes, auth pages, Sanity Studio, and debug endpoints.

- [x] **#7 — No `BreadcrumbList` on climatology pages**
  Added `BreadcrumbList` to the climatology page JSON-LD graph: Home → Surf Climatology → [Spot, Country].

- [ ] **#9 — No `sameAs` on Organization schema** *(shelved — no social accounts yet)*
  Social profile URLs (Twitter/X, Instagram) on the `Organization` node boost entity clarity
  for Google Knowledge Graph and AI engines. Revisit when social handles are live.

## Low

- [x] **#10 — `keywords` meta tag in root layout**
  Removed from `app/layout.tsx`.

- [x] **#11 — Sitemap `STATIC_LAST_MODIFIED` dates are hardcoded**
  Added a comment in `app/sitemap.ts` to update the date for a route whenever you ship a
  meaningful content change there. Updated `/`, `/faq`, and `/blog` to today.

---

## GEO Roadmap (AI Search — future work)

- [x] FAQ page (`/faq`) with FAQ schema — surf conditions vocabulary
- [x] HowTo schema on blog posts — added `isHowTo` + `howToSteps` fields to Sanity post schema;
  when enabled on a post, emits a `HowTo` node in the JSON-LD graph with numbered steps
- [x] E-E-A-T improvements — author `credentials` field added to Sanity author schema; BlogPosting
  now emits full `Person` schema (name, jobTitle, credentials/bio, avatar image); Organization
  now has `description` and `knowsAbout` array (surf forecasting, ECMWF, NOAA, etc.)
- [ ] `sameAs` links on Organization once social profiles are active *(shelved)*
- [x] `mentions` and `about` fields on BlogPosting — `about` derived from post categories;
  `mentions` derived from `surfSpots` slugs, resolved to full Place entities with geo coords
- [ ] Structured answer blocks in blog content — content strategy, not code; write blog posts
  with short citable paragraphs that directly answer a question before expanding on it

# Groundswell SEO & GEO Checklist

Last audited: 2026-06-02. Run `/seo audit` any time to refresh.

---

## Done Criteria (definition of "up to speed")

- [ ] Site verified in Google Search Console and sitemap submitted
- [ ] Site verified in Bing Webmaster Tools and sitemap submitted
- [ ] Lighthouse SEO score = 100 on `/`, a spot page, and `/faq`
- [ ] Lighthouse Accessibility score ≥ 95 on key pages
- [ ] Core Web Vitals pass on desktop (LCP < 2.5 s, CLS < 0.1, INP < 200 ms)
- [ ] All `<img>` tags have descriptive alt text (no empty or missing alt attributes)
- [ ] No soft-404s — unknown URLs return HTTP 404
- [ ] GEO spot-check: paste a spot page URL into ChatGPT/Perplexity and confirm it reads real surf content

---

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

## Indexing & Discovery

- [ ] **Submit sitemap to Google Search Console**
  Verify ownership of `groundswell.surf` and submit `https://groundswell.surf/sitemap.xml`.
  Monitor for crawl errors, coverage issues, and manual actions.

- [ ] **Submit sitemap to Bing Webmaster Tools**
  Verify ownership at `bing.com/webmasters` and submit the same sitemap URL.
  Bing also powers DuckDuckGo and some AI search surfaces.

- [ ] **Verify `noindex` intent on private/auth routes**
  Confirm `robots.ts` disallows (or meta robots adds `noindex`) on `/sign-in`, `/sign-up`,
  `/api/*`, `/studio/*`, and any user-specific pages like `/dashboard` or spot-editor routes.
  Run `curl -A Googlebot https://groundswell.surf/sign-in` and check raw HTML for `noindex`.

- [ ] **Verify no soft-404s**
  Request a non-existent URL (e.g. `/does-not-exist`) and confirm the HTTP status is 404,
  not a 200 with a "Not Found" page (soft-404 confuses crawlers and wastes crawl budget).

---

## Core Web Vitals & Performance (Lighthouse)

Run Lighthouse in Chrome DevTools or `npx lighthouse https://groundswell.surf --view` against
key pages: `/` (home), a spot page, `/faq`, and `/blog`.

Targets: Performance ≥ 90 desktop / ≥ 70 mobile · SEO 100 · Accessibility ≥ 95 · Best Practices 100.

- [ ] **Run Lighthouse on `/` (home)**
  Record baseline scores. Flag any LCP > 2.5 s, TBT > 200 ms, or CLS > 0.1.

- [ ] **Run Lighthouse on a spot page** (e.g. `/spots/pipeline`)
  Spot pages are the highest-traffic entry point — they must be fast on mobile.

- [ ] **Run Lighthouse on `/faq`**
  Confirm SEO 100 and that FAQPage rich result is detectable (check "Additional items" in
  Google Rich Results Test at `search.google.com/test/rich-results`).

- [ ] **Image optimization — convert to WebP and add responsive sizes**
  Any JPEG/PNG hero images or OG images should be converted to WebP.
  Add `sizes` + `srcSet` attributes (or use `<Image>` from `next/image`) so mobile doesn't
  download desktop-sized assets. Use `fetchpriority="high"` on the LCP `<img>`.

- [ ] **Image alt-text audit**
  Search the codebase for `<img` tags missing or with empty `alt` attributes.
  Surf spot photos, map thumbnails, and wave-height charts all need descriptive alt text.
  (`Grep pattern: <img(?![^>]*\balt=)` or use the Lighthouse Accessibility report.)

---

## Open Graph & Social

- [ ] **Per-page OG images for key routes**
  `/` (home), `/blog`, and `/faq` should have a custom 1200 × 630 `og:image`.
  Spot pages already pull a photo — confirm the `og:image` meta tag resolves to an
  absolute URL and the image is accessible without authentication.

- [ ] **Validate OG tags with `opengraph.xyz` or Facebook Debugger**
  Paste key URLs into a social preview tool and confirm title, description, and image render
  correctly. Missing OG images cause plain-text link previews in Slack, Twitter, and iMessage.

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
- [ ] **GEO spot-check** — paste a spot page URL (e.g. `/spots/pipeline`) into ChatGPT, Perplexity,
  and Google AI Overview. Confirm the AI can read and summarize real surf conditions content,
  not a generic "I can't access the site" response. Repeat after major schema or content changes.

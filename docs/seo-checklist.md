# Groundswell SEO & GEO Checklist

Last audited: 2026-06-02. Run `/seo audit` any time to refresh.

---

## Done Criteria (definition of "up to speed")

- [x] Site verified in Google Search Console and sitemap submitted
- [ ] Site verified in Bing Webmaster Tools and sitemap submitted
- [ ] Lighthouse SEO score = 100 on `/`, a spot page, and `/faq`
- [ ] Lighthouse Accessibility score ≥ 95 on key pages
- [ ] Core Web Vitals pass on desktop (LCP < 2.5 s, CLS < 0.1, INP < 200 ms)
- [x] All `<img>` tags have descriptive alt text (no empty or missing alt attributes)
- [x] No soft-404s — unknown URLs return HTTP 404
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

- [x] **Submit sitemap to Google Search Console**
  Verify ownership of `groundswell.surf` and submit `https://groundswell.surf/sitemap.xml`.
  Sitemap processed successfully ✅ 2026-06-04.

- [x] **Submit sitemap to Bing Webmaster Tools**
  Verify ownership at `bing.com/webmasters` and submit the same sitemap URL.
  Bing also powers DuckDuckGo and some AI search surfaces.

- [x] **Verify `noindex` intent on private/auth routes**
  `robots.ts` disallows `/sign-in`, `/sign-up`, `/api/*`, `/studio/*`, `/debug`. `/sign-in`
  itself returns 404 (no route exists — Clerk handles auth externally), so it's uncrawlable
  regardless.

- [x] **Verify no soft-404s**
  `/this-page-does-not-exist` returns HTTP 404 ✓

---

## Core Web Vitals & Performance (Lighthouse)

Run Lighthouse in Chrome DevTools or `npx lighthouse https://groundswell.surf --view` against
key pages: `/` (home), a spot page, `/faq`, and `/blog`.

Targets: Performance ≥ 90 desktop / ≥ 70 mobile · SEO 100 · Accessibility ≥ 95 · Best Practices 100.

- [x] **Run Lighthouse on `/` (home)**
  Audited 2026-06-04 (mobile, simulated 4G). Scores: **Performance 77 · SEO 100 · Accessibility 100 · Best Practices 100**.
  Key metrics: FCP 2.2 s · LCP 3.8 s · TBT 410 ms · CLS 0 · SI 2.2 s.
  Issues found and resolved same session:
  - Legacy JS polyfills (`Array.at`, `Object.hasOwn`, etc.) in chunk `0-w966uza5eby.js` → added `.browserslistrc` targeting last 2 browser versions; est. 14 KiB + 150 ms LCP saved.
  - `MarketingLanding` was a static import in the main bundle (below-fold) → converted to `dynamic()`.
  - Wave SVG animations missing `will-change: transform` → added; promotes to compositor layer before animation starts.
  Re-run after next deploy to measure improvement. Target: Performance ≥ 70 mobile.

- [x] **Run Lighthouse on a spot page** (e.g. `/spots/pipeline`)
  Audited 2026-06-04 on `/?lat=21.6632&lon=-158.0523&name=Pipeline` (mobile, simulated 4G). Score: **Performance 66**.
  Key metrics: TBT 1,270 ms · Main thread 9.3 s (Script Eval 4,659 ms · Style & Layout 1,100 ms · Rendering 927 ms).
  Issues found and resolved:
  - `ForecastTimeline` read `offsetWidth`/`offsetHeight` synchronously on mount (forced reflow ~70 ms + ~37 ms) → deferred both initial reads to `requestAnimationFrame`.
  - `/spots/pipeline` returned 404 — no route existed → created `app/spots/[slug]/page.tsx` using the existing spot catalog; `generateStaticParams` pre-renders all ~100 spots; spot pages added to sitemap at priority 0.9.
  Remaining: heavy Recharts chart initialisation (4 `ResponsiveContainer` instances load simultaneously when a report is fetched) drives most of the remaining TBT. Next step: replace `ResponsiveContainer` with fixed pixel heights to eliminate the concurrent layout-measurement burst.

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

- [x] **Per-page OG images for key routes**
  `/api/og` now accepts `title`+`subtitle` params. `/faq`, `/blog`, and blog posts without
  a Sanity cover image all pass page-specific params. Home page uses the default brand card.
  Preview: `/api/og?title=Surf+Forecast+FAQ&subtitle=...`

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

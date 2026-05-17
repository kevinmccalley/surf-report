# Groundswell — Technical SEO Checklist

Items identified May 2026. Work through in priority order.

---

## High priority

- [x] **`/llms.txt`** — Plain-markdown file in `public/` telling AI crawlers (ChatGPT, Perplexity, Anthropic, Google AI) what Groundswell is, what data it contains, and where to find authoritative pages. The emerging robots.txt equivalent for the AI search era.

- [x] **Fix blog post OG images** — `generateMetadata` in `app/blog/[slug]/page.tsx` emits the generic `/api/og` for every post instead of the actual Sanity cover image. AI-powered social previews and search snippets read the OG image; fixed to use the real cover image with `/api/og` as fallback.

- [x] **`BreadcrumbList` JSON-LD on blog posts** — The breadcrumb `<nav>` exists in HTML but has no structured data counterpart. Google's AI Overviews and rich results use `BreadcrumbList` to understand site hierarchy.

- [x] **`Organization` schema in root layout** — Expanded the existing `WebSite` JSON-LD into a `@graph` block that also includes an `Organization` node (logo, contact point, `@id` anchor). Feeds AI models' E-E-A-T trust graph for citations.

- [ ] **Add `/top100` to sitemap** — `app/top100` is a strong keyword-traffic page but is currently whitelisted-only (`BYPASS_EMAILS`). Add to sitemap and remove `robots: { index: false }` once the feature ships publicly.

---

## Medium priority

- [x] **`Dataset` schema on climatology pages** — Converted single `Place` to a `@graph` with `Place` + `Dataset` (ERA5 `temporalCoverage`, `spatialCoverage`, `measurementTechnique`, `variableMeasured`, `creator`). Makes pages citable by AI models answering "best time to surf at X."

- [x] **`FAQPage` schema** — Added to `app/support/page.tsx` (server component wrapper) with 6 Q&A pairs covering contact, billing, forecast accuracy, refunds, GDPR, and bug reports.

- [x] **Sitemap `lastModified` accuracy** — Blog posts now use Sanity `_updatedAt ?? publishedAt` via new `getAllSlugsWithDate()` helper. Static and climatology pages use pinned dates. Blog index `lastModified` reflects most recent post date.

- [x] **Internal linking: blog ↔ climatology** — Fully automatic once writer tags spots in Studio. `surfSpots` field (searchable picker from the curated 250-spot list) added to Sanity post schema. Blog posts render "Swell history" cards linking to each tagged spot's climatology page. Climatology pages fetch and render a "Related articles" section for posts tagged with that slug. Only ongoing editorial task: authors linking to climatology pages organically within prose.

---

## Lower priority / process

- [x] **`hreflang` on blog posts** — N/A: blog content is English-only. Hreflang is only correct when translated content actually exists at the alternate URL. Climatology pages correctly use hreflang because they have locale variants via `?lang=`.

- [x] **`html lang` attribute reflects active locale** — `LanguageProvider` now syncs `document.documentElement.lang` to the active locale via `useEffect`. Covers both user-initiated switches and localStorage restore on page load. Googlebot (JS-aware) and screen readers both react to this correctly.

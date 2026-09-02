# Groundswell — AI Visibility Standing Checklist Log

Dated entries, newest first. Modeled on GoodStockPress's `docs/ai-visibility-log.md` / System #4
(`goodstockpress/docs/self-maintaining-systems.md`) — same 7-point checklist, adapted for
Groundswell's page types. This is a technical AI-crawler-readiness audit (raw-HTML crawlability,
structured data, meta fundamentals, answer-clarity) — **not** a "does ChatGPT mention us" check;
that's a separate, much fuzzier signal (see item 7 below) that stays informational until the site
has enough traffic/reviews for it to mean anything.

---

## 2026-09-02 — Third run (interactive) — full SEO + AI-visibility audit, then P0–P3 execution

Ran as the GoodStockPress-pattern audit (two design-crafted checklist artifacts: SEO 🌊
`claude.ai/code/artifact/ef540def-6a83-4265-8304-0a1b5fbb3106`, AI Visibility 🤖
`.../8656014b-37e0-45dc-a186-aebd77efcbef`), both scored **B–**, then executed P0/P1/P2/P3.

**7-point checklist:** 1 raw-HTML crawlability PASS (SSR content on every page type). 2 JSON-LD
PASS — added `AboutPage`+`Organization`(founder/foundingDate)+`BreadcrumbList` on the new `/about`,
`BlogPosting.inLanguage` on translated posts. 3 sitemap/llms sync — **`llms-full.txt` created**
(full FAQ + accuracy methodology, one fetch); `llms.txt` now references it + notes blog `?lang=`
variants; sitemap emits per-post hreflang alternates. 4 meta fundamentals — spot pages gained
5-locale hreflang + a single topical `<h1>` (was two); `/regions/[slug]` meta description moved
into i18n; blog posts got `?lang=`-aware `<title>`/canonical/hreflang/og:locale. 5 answer-clarity
— homepage now leads with a plain "Groundswell is a surf-forecast service: …" lede; `/regions`
index intro rewritten to state value. 6 robots.txt PASS (unchanged). 7 retrievability — no
material change (brand + answered category queries still return only competitors; expected).

**Shipped:** P0 (`d063626` regions og:image + llms.txt entry) promoted to production `7ef8222`.
P1 + P2/P3 batch promoted to production `8a7d4cb` (spot H1+hreflang, `/about`, homepage lede,
`Organization.sameAs` = the real Instagram `@ground.swell.surf`, www→apex 301, security headers,
`/api/og` immutable cache, `/regions` i18n, `/spots` JSON-LD trim 1.13 MB→749 KB, sitemap dates).
Blog `?lang=` indexing on `dev` `9d59df0` (Kevin translated the evergreen guides in Studio).
`llms-full.txt` + this entry: `dev`, pending promotion.

**Diagnosed, not fixed:** every HTML response is `Cache-Control: no-store` — root cause is
`cookies()` in `app/layout.tsx` forcing whole-tree dynamic rendering (NOT Clerk). Handed to a
scheduled cloud routine that opens a PR. **Still open:** Recharts fixed-heights + Lighthouse
re-run; Google Rich Results test (manual).

**Housekeeping:** earlier unattended runs left `/.aiv_*.html` / `.aiv_*.xml` scratch files in the
repo root (untracked) — still safe to `rm .aiv_*`.

---

## 2026-08-31 — Second run (scheduled, unattended)

**Pages checked:** Homepage (`/`), `/faq`, `/blog`, one recent post (`/blog/best-time-to-surf-morocco`,
pub 2026-08-23), `/spots`, `/climatology/pipeline`, plus the `/regions` route group (new since the
last run). Raw HTML fetched via `curl -A ClaudeBot` (no JS execution).

**1. Raw-HTML crawlability — PASS.** Server-delivered HTML carries the real answerable content on
every page: FAQ answer text ("swell period" ×40), full blog article body (Taghazout ×44, Anchor
Point ×24, "Morocco surfs year-round" ×7), spot names on `/spots` (Uluwatu/Pipeline/Cloudbreak/
Jeffreys Bay), climatology data on `/climatology/pipeline` (ERA5 ×8, "significant wave height" ×7,
"peak season" ×10, month names), and all 59 region names on `/regions` (h2 per card). Counts done
with `grep -o … | wc -l`, not `grep -c` (Next.js HTML is one line).

**2. JSON-LD structured data — PASS.** Correct schema per page type, all live:
`WebSite`+`Organization`+`SoftwareApplication`+`ContactPoint` sitewide; `FAQPage`+`Question`/`Answer`
×20 + `SpeakableSpecification` + `BreadcrumbList` on `/faq`; `Blog`+`BlogPosting` ×8 on the index;
`BlogPosting`+`Person`+`Place`/`GeoCoordinates` ×5 + `BreadcrumbList` on the post; `ItemList`+
`SportsActivityLocation`+`GeoCoordinates` on `/spots`; `Place`+`GeoCoordinates`+`Dataset`+
`BreadcrumbList` on `/climatology/pipeline`; `ItemList` (`numberOfItems` 59, matches 59 region
`ListItem`s + 2 breadcrumb) + `BreadcrumbList` on `/regions`. **Speakable cross-reference checked:**
`.faq-question` / `.faq-answer` from the `SpeakableSpecification.cssSelector` do exist on real
rendered elements (`class="faq-question text-lg font-semibold …"`), not only inside the JSON-LD.

**3. sitemap.xml + llms.txt sync — FIXED (llms.txt).** Sitemap healthy: 745 URLs (up from 378 last
run — the `/regions` index + `/regions/map` + 59 `/regions/{slug}` + `/regions/country/{code}` all
present), `<lastmod>` values real (newest 2026-08-27, matches the France post). **`llms.txt` gap:**
the entire `/regions` feature (live, 60+ crawlable pages, in the sitemap) was missing from the "Key
pages" section — exactly the "new route shipped, nobody updated llms.txt" case. Added a `Surf
Regions` entry (with the `/regions/map` world atlas and `/regions/country/{code}` roll-ups noted
inline). Committed locally.

**4. Meta fundamentals — one gap FIXED.** `<title>`, meta description, and canonical present and
correct on all 7 page types. OG/Twitter: home, `/faq`, `/blog`, the post, `/spots`, and
`/climatology` all carry a full `og:image` (via `/api/og`) + `twitter:card`. **The `/regions` route
group had no `og:image` / `twitter:image`** — all 4 metadata files (`app/regions/page.tsx`,
`[slug]/page.tsx`, `country/[code]/page.tsx`, `map/page.tsx`) built an `openGraph` block that
omitted `images`, so ~65 live URLs shipped social/AI cards with no image. Added
`images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }]` + `twitter.images` to each,
using the existing `/api/og?title=…&subtitle=…` pattern copied verbatim from `app/blog/[slug]/page.tsx`.
No new user-visible strings — the OG URL reuses the already-localized `title`/`description` vars.
Committed locally.

**5. First ~150 words of extractable text — PASS, one minor note.** Homepage opens with the same
specific copy as last run. `/regions` opens with h1 "Surf Regions" + "Every curated surf region,
its breaks mapped together. Open one for the list-and-map view." — clear and not filler, but thin
for GEO (no mention of forecasts, spot counts, or what opening a region gets you). Logged as an
open judgment-call item below, not fixed (translated copy — needs a human + 5 locale files).

**6. robots.txt — PASS.** Byte-identical to last run: `Allow: /` with the four narrow disallows
(`/api/`, `/sign-in`, `/sign-up`, `/studio/`, `/debug`), sitemap referenced. No bot-specific blocks.

**7. Traditional/AI search presence — no material change.** "what is swell period surf forecast"
still does not surface groundswell.surf; surf-forecast.com, SurfSpotGuide, Cornish Wave, Lapoint
rank. Identical to the 2026-08-23 baseline — not an actionable finding.

**Checked and explicitly NOT findings:** `/top100` and `/gallery` return 404 to signed-out
crawlers — this is deliberate (`robots: { index:false, follow:false }` + `redirect('/sign-in')` /
bypass-email gate in both `page.tsx`; `/top100` is an internal ops view). `Organization` JSON-LD
still has no `sameAs` — unchanged pre-existing item, shelved pending real social accounts (see
`project_seo_geo.md`).

**Open items needing a human judgment call:**
1. **`/regions` detail meta description is hardcoded English, bypassing `t()`.**
   `app/regions/[slug]/page.tsx:39` — `` `${region.name}: ${count} curated surf breaks mapped
   together, each with a live forecast on Groundswell.` `` is user-facing copy not going through the
   i18n system (violates CLAUDE.md). Needs a new `regions.meta.detailDesc` key + proper translations
   in all 5 locale files. Not safe to do unattended.
2. **`/regions` index intro is thin for answer engines.** "Every curated surf region, its breaks
   mapped together…" is accurate but doesn't state the value (live forecast per break, ~59 regions,
   world atlas). A richer localized intro paragraph would help GEO extraction. Translated copy —
   human + 5 locales.

**Fixed and committed locally this run** (branch `dev` per repo workflow, awaiting Kevin's review +
push):
- `seo(regions): add og:image + llms.txt entry for the /regions route group` — adds
  `openGraph.images` + `twitter.images` to all 4 `app/regions/**/page.tsx` metadata blocks
  (`/api/og` dynamic card, matching the blog-post pattern); adds a `Surf Regions` entry to
  `public/llms.txt` Key pages.

**Housekeeping:** this unattended run left scratch fetch files `/.aiv_*.html` and `/.aiv_*.xml` in
the repo root (untracked, NOT staged) — the run's tool policy blocked file deletion. Safe to
`rm .aiv_*` on review.

**Overall:** clean pass on 5 of 7 items; 2 mechanical fixes committed locally (regions OG images,
llms.txt entry), both driven by the `/regions` feature having shipped between runs without its
AI-visibility surface being updated. Two translated-copy improvements left for a human.

## 2026-08-23 — First run (interactive, manual)

**Pages checked:** Homepage (`/`), `/faq`, `/blog`, one blog post (`/blog/what-is-swell-period`),
`/spots`. Fetched raw HTML directly via curl (no JS execution) — same method AI crawlers
(GPTBot, ClaudeBot, CCBot, PerplexityBot) use.

**1. Raw-HTML crawlability — PASS.** Verified actual content (blog article body, FAQ Q&A text,
spot directory names) is present in server-delivered HTML on every page checked, not only
client-rendered. All pages are React Server Components / SSR'd, no client-only content gaps found.

**2. JSON-LD structured data — PASS.** Appropriate schema per page type confirmed live:
`WebSite`+`Organization`+`SoftwareApplication` sitewide; `FAQPage`+`BreadcrumbList` on `/faq`;
`Blog` on the blog index, `BlogPosting`+`BreadcrumbList` on posts; `ItemList`+`SportsActivityLocation`
on `/spots`.

**3. sitemap.xml + llms.txt sync — FIXED.** Sitemap: 378 URLs, freshest `<lastmod>` is today
(2026-08-23) — healthy. `llms.txt`'s "Key pages" section was missing two significant, GEO-relevant
pages: `/faq` (carries `FAQPage` schema — exactly the direct-answer content AI engines want to
know about) and `/spots` (220+ spot directory). Added both to `public/llms.txt` with short
descriptions. Committed locally.

**4. Meta fundamentals — PASS.** Title, meta description, canonical link, all four OG tags
(title/description/image/site_name), and twitter:card confirmed present on every page checked.

**5. First ~150 words of extractable text — PASS (spot-checked).** Homepage opens with real,
specific copy ("Real-time surf reports and 10-day forecasts for any spot in the world. Wave
height, swell, wind, tides, and more.") rather than vague filler — this is the window most answer
engines actually quote from.

**6. robots.txt — PASS.** Wildcard-permissive (`Allow: /`), sensible narrow disallows
(`/api/`, `/sign-in`, `/sign-up`, `/studio/`, `/debug`), sitemap referenced correctly.

**7. Traditional/AI search presence spot-check — informational, not actionable.** Searched "what
is swell period surf forecast" — groundswell.surf did not appear; established competitors
(Surfline, SurfSpotGuide, Windy, Quiver, 4shor) did. Expected for a young site with this checklist's
first-ever run — there's no prior baseline to compare against yet. Note for future runs: track
whether this changes, don't treat a zero-result baseline itself as a problem to fix.

**Known open item (pre-existing, not new):** `Organization` JSON-LD has no `sameAs` field — no
linked social profiles. Already tracked in project memory (`project_seo_geo.md`) as shelved
pending Groundswell having real social accounts to link. Relevant here because `sameAs` is a
genuine E-E-A-T/entity-clarity signal for GEO, not just traditional SEO — worth revisiting once
social presence exists.

**Fixed and committed locally this run:** `public/llms.txt` — added `/faq` and `/spots` to Key
pages. (Repo workflow: commits go to `dev`, promoted to `master` after confirming on
dev.groundswell.surf — see project git-workflow convention.)

**Overall:** strong first run — Groundswell's baseline SEO/GEO investment (sitemap, robots,
hreflang, FAQ/HowTo/BlogPosting schema — see `project_seo_geo.md`) meant 6 of 7 items passed
clean on the first pass. Only real gap was a content-completeness miss in `llms.txt`, now fixed.

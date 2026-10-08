# Groundswell — AI Visibility Standing Checklist Log

Dated entries, newest first. Modeled on GoodStockPress's `docs/ai-visibility-log.md` / System #4
(`goodstockpress/docs/self-maintaining-systems.md`) — same 7-point checklist, adapted for
Groundswell's page types. This is a technical AI-crawler-readiness audit (raw-HTML crawlability,
structured data, meta fundamentals, answer-clarity) — **not** a "does ChatGPT mention us" check;
that's a separate, much fuzzier signal (see item 7 below) that stays informational until the site
has enough traffic/reviews for it to mean anything.

---

## 2026-10-05 — Sixth run (scheduled, unattended)

**Pages checked:** `/`, `/faq`, `/blog`, one recent post (`/blog/eleven-best-breaks-for-beginner-surfers`,
2026-09-28), `/spots`, `/climatology/pipeline`, plus `robots.txt`, `sitemap.xml`, `blog/rss.xml`,
`llms.txt`, `llms-full.txt`. Raw HTML fetched with a `ClaudeBot` user-agent (Node `fetch`, no JS
execution) into `%TEMP%\aiv-1005\` — no scratch files written to the repo; counts done with JS
`match(/…/g).length`, not `grep -c`.

**1. Raw-HTML crawlability — PASS.** Homepage lede + "10-day" ×19; FAQ answers present (swell
period ×52, offshore ×42); `/blog` links all 15 posts; beginner-surfers post body fully SSR'd
(~2,300 visible words, "beginner" ×89, Waikiki ×13); `/spots` spot names present (Uluwatu,
Pipeline, Mavericks; 994 spots); climatology data present (ERA5 ×8, "significant wave height" ×9,
all 12 monthly rows).

**2. JSON-LD — PASS.** Unchanged: `FAQPage` (20 Q/A) + `SpeakableSpecification` + `BreadcrumbList`
on `/faq` — `.faq-question` / `.faq-answer` each exist on 20 real elements (last run's "×42"
counted the string, including the JSON-LD/RSC payload; 20 is the `class="…"` attribute count and
matches the 20 questions); `Blog`+`BlogPosting` ×10 on `/blog`; `BlogPosting`+`Person`+`Place` ×10+
`GeoCoordinates`+`BreadcrumbList` on the post (`datePublished`/`dateModified` both 2026-09-28);
`ItemList` (`numberOfItems` 994)+`SportsActivityLocation` ×100 on `/spots`; `Place`+`Dataset`+
`BreadcrumbList` on climatology; `WebSite`+`Organization`+`SoftwareApplication` sitewide.

**3. sitemap.xml + llms.txt sync — OPEN ITEM 1 STILL OPEN AND WORSE, llms.txt OK.**
- `llms.txt` Key pages still match the top-level public routes in `app/` (no new route dirs since
  last run). Live `llms.txt` differs from the repo only by the `/about` line (`9ca67fa`, on `dev`,
  not yet on master). No edit needed.
- **Production `sitemap.xml` now omits the 3 newest posts** (12 of 15): `…-for-longboarders`
  (09-20), `…-for-shortboarders` (09-24), `…-for-beginner-surfers` (09-28). Content is identical
  to the 09-21 and 09-28 fetches (1,457 URLs, newest blog `<lastmod>` 2026-09-16). New evidence
  for whoever picks this up:
  - There has been **no production deploy since 2026-09-13** (`8c9dfad`, per GitHub deployments),
    yet the sitemap contains the 09-16 post — so it *did* regenerate once after the build (on or
    before 09-21) and has not picked up anything published since.
  - This run's first request was an edge `MISS` (`Age: 0`); a second request 66 s later was an
    edge `HIT` with the same 12-post body. Last run saw `Age ≈ 604,800` = the edge had held the
    previous run's copy for a full week. So the edge keeps whatever the origin hands it for 7+
    days, and the origin copy is itself ≥2 weeks stale — `revalidate = 86400` is not producing a
    daily refresh in practice.
  - `blog/rss.xml` behaved correctly again: first request `X-Vercel-Cache: PRERENDER` with a stale
    12-item body, second request 15 items. Same Sanity filter, so the data is fine — it's the
    sitemap route's caching.
  - Working hypothesis (unverified): each rare sitemap regeneration reads `getAllSlugsWithDate()`
    from the 1 h fetch data-cache stale-while-revalidate, so it bakes in the *previous* fetch's
    result, and regenerations are rare because the edge shields the origin. Either way the fix
    is the same as proposed last run: on-demand `revalidatePath('/sitemap.xml')` from
    `scripts/blog-publish` / a Sanity webhook, or serve the sitemap dynamically with an explicit
    `s-maxage`. Not changed unattended — can't be verified without a prod deploy.
- `/spots` index still absent from the live sitemap (fix `9ca67fa` is on `dev`; master is still
  `8c9dfad`, now 259 commits behind `origin/dev`). Ships with the next dev→master promotion.
- `<lastmod>` values: pinned constants, unchanged (spot pages 2026-06-08, climatology 2025-01-01).

**4. Meta fundamentals — PASS.** title, meta description, canonical, `og:title/description/image/
site_name`, `twitter:card`, single `<h1>` on all 6 pages. Climatology `og:image` still the generic
`/api/og` (open item 3).

**5. First ~150 words — PASS with notes.** Homepage, `/faq`, `/blog`, post and `/spots` openings
state plainly what the page is. Climatology opener unchanged (data labels, no summary sentence —
open item 3).

**6. robots.txt — PASS.** Unchanged: `Allow: /` + `/api/`, `/sign-in`, `/sign-up`, `/studio/`,
`/debug` disallows, sitemap referenced, no bot-specific blocks.

**7. Search presence — no material change (informational).** Brand query "groundswell.surf surf
forecast" still returns the homepage, and the engine summary again quotes the lede ("live
conditions and a 10-day wave forecast for any surf spot on earth, plus 4+ years of swell
history") — and also quotes "608 spots live", so the inconsistent spot count (open item 2) is now
being repeated by answer engines. Category query "what is swell period surf forecast": not present
(expected).

**Open items needing a human judgment call (nothing edited):**
1. **Sitemap not refreshing on prod** (§3) — carried over, now 3 posts missing. Highest priority.
2. **Spot-count claims** — carried over, unchanged: homepage "608 spots live", `/spots` meta
   description + `llms.txt` "220+", `/spots` OG subtitle "500+", `/spots` page + `ItemList` 994,
   `llms.txt` Data sources "~6,900". In-app copy → needs `t()` ×5 locales, then `llms.txt`.
3. **`/climatology/[slug]` opening text + per-spot OG card** — carried over, unchanged.
4. **dev→master promotion is overdue for SEO purposes** — `/spots` in the sitemap and `/about` in
   `llms.txt` have been waiting on `dev` since 09-21.

**Fixed and committed locally:** nothing in app/SEO files — no mechanical fix was available this
run. Only this log entry is committed.

**Housekeeping:** the untracked `/.aiv_*.html` / `.aiv_*.xml` scratch files from earlier runs are
still in the repo root (safe to `rm .aiv_*`); this run wrote none.

---

## 2026-09-28 — Fifth run (scheduled, unattended)

**Pages checked:** `/`, `/faq`, `/blog`, one recent post (`/blog/eleven-best-waves-for-shortboarders`,
2026-09-24), `/spots`, `/climatology/pipeline`, plus `robots.txt`, `sitemap.xml`, `blog/rss.xml`.
Raw HTML fetched via `curl -A ClaudeBot` into `%TEMP%\aiv\` (no scratch files written to the repo);
counts done with JS `match(/…/g).length`, not `grep -c`.

**1. Raw-HTML crawlability — PASS.** Homepage lede + "10-day" ×19; FAQ answers present (swell
period ×52, offshore ×42, `.faq-question`/`.faq-answer` ×42 each); `/blog` lists all 14 posts;
shortboarders post body fully SSR'd (~2,100 words, Pipeline ×23, barrel ×58); `/spots` spot names
present (Uluwatu, Pipeline, Mavericks, Cloudbreak; 994 spots); climatology data present (ERA5 ×8,
"significant wave height" ×9, all 12 monthly rows).

**2. JSON-LD — PASS.** Unchanged from last run: `FAQPage`+`Speakable`+`BreadcrumbList` on `/faq`;
`Blog`+`BlogPosting` on `/blog`; `BlogPosting`+`Person`+`Place`+`GeoCoordinates`+`BreadcrumbList`
on the post; `ItemList`+`SportsActivityLocation`+`GeoCoordinates` on `/spots`; `Place`+`Dataset`+
`BreadcrumbList` on climatology; `WebSite`+`Organization`+`SoftwareApplication` sitewide.

**3. sitemap.xml + llms.txt sync — 1 NEW OPEN ITEM (not fixed), llms.txt OK.**
- `llms.txt` Key pages still match the top-level public routes in `app/` (home, spots, regions,
  climatology, blog, faq, accuracy, about). `/top100` and `/gallery` remain intentionally gated
  (see 2026-09-02 entry); legal/support pages are fine to omit. No edit needed.
- **Production `sitemap.xml` is frozen at 2026-09-21 06:31:22Z** (`Last-Modified` header,
  `Age: 604,8xx`, `X-Vercel-Cache: HIT`) even though `app/sitemap.ts` has `revalidate = 86400`.
  Five requests over ~2 min (ClaudeBot + Googlebot UAs, with and without a query string) did **not**
  trigger regeneration. Consequence: the two newest posts — `eleven-best-waves-for-longboarders`
  (09-20) and `eleven-best-waves-for-shortboarders` (09-24) — are **not in the sitemap** (12 of 14
  posts). Last run's "should self-heal" hypothesis is therefore wrong: this is page-level ISR not
  revalidating, not just a stale 1 h data-cache entry. By contrast `blog/rss.xml` (route handler,
  `revalidate = 3600`) **did** regenerate on the first request this run (Age 42 → now lists all
  14). Needs a human session: check Vercel's ISR/function logs for `/sitemap.xml`, and consider
  whether the metadata-route sitemap is being treated as fully static in Next 16 (docs:
  "`sitemap.js` is … cached by default unless it uses a Request-time API or dynamic config") —
  possible fixes are an on-demand `revalidatePath('/sitemap.xml')` from the blog-publish flow /
  Sanity webhook, or a Cache-Control'd dynamic route. Not changed unattended because it can't be
  verified without a prod deploy.
- Last run's fix `9ca67fa` (`/spots` index in sitemap) is on `origin/dev` but **not on master**
  (master = `8c9dfad`, 2026-09-13), so `/spots` is still absent from the live sitemap. Expected —
  it ships with the next dev→master promotion.
- `<lastmod>` values: still the pinned constants; spot pages 2026-06-08 and climatology
  2025-01-01 ×682 each are getting old but are honest "last meaningful change" dates.

**4. Meta fundamentals — PASS.** title, meta description, canonical, `og:title/description/image/
site_name`, `twitter:card` on all 6 pages. Climatology `og:image` still the generic `/api/og`
(open item 2 below, unchanged).

**5. First ~150 words — PASS with notes.** Homepage, `/faq`, `/blog`, post and `/spots` openings all
state plainly what the page is. Climatology opener unchanged (data label, no summary sentence —
open item 2).

**6. robots.txt — PASS.** Unchanged: `Allow: /` + `/api/`, `/sign-in`, `/sign-up`, `/studio/`,
`/debug` disallows, sitemap referenced, no bot-specific blocks.

**7. Search presence — IMPROVED (informational).** Brand query "groundswell.surf surf forecast" now
returns the homepage (`Groundswell — Surf Reports Worldwide`) and the search engine's summary quotes
the homepage lede almost verbatim ("live conditions and a 10-day wave forecast for any surf spot on
earth, plus 4+ years of swell history") — evidence the 09-02 lede rewrite is being extracted as
intended. Category query "what is swell period surf forecast": not present (expected at this age).

**Open items needing a human judgment call (nothing edited):**
1. **NEW — sitemap ISR not revalidating on prod** (details in §3). Highest priority of the three:
   every new blog post is invisible to sitemap-driven crawlers until the next deploy.
2. **Spot-count claims (carried over, now worse).** Homepage says "**608** spots live", `/spots`
   meta description + `llms.txt` say "**220+**", `/spots` OG subtitle says "**500+**", `/spots`
   page + `ItemList.numberOfItems` say **994**, and `llms.txt` "Data sources" says "~6,900". Four
   different numbers. Derive from data where possible, put through `t()` in all 5 locales, then
   update `llms.txt` to match.
3. **`/climatology/[slug]` opening text + per-spot OG card** (carried over, unchanged).

**Fixed and committed locally:** nothing — clean pass apart from the open items above.

**Housekeeping:** the untracked `/.aiv_*.html` / `.aiv_*.xml` scratch files from earlier runs are
still in the repo root (safe to `rm .aiv_*`); this run wrote none.

---

## 2026-09-21 — Fourth run (scheduled, unattended)

**Pages checked:** `/`, `/faq`, `/blog`, one recent post (`/blog/eleven-best-beach-breaks-in-the-world`),
`/spots`, `/climatology/pipeline`, plus `/regions` and `/about` (both new since the last scheduled
run). Raw HTML fetched via `curl -A ClaudeBot`; counts done with `grep -o … | wc -l`.

**1. Raw-HTML crawlability — PASS.** FAQ answer text present (swell period ×52, offshore ×42,
lowercase "groundswell" ×62), blog article body present (Hossegor ×17, "beach break" ×71), spot names on
`/spots` (Uluwatu, Pipeline, Cloudbreak, Mavericks), climatology data on `/climatology/pipeline`
(ERA5 ×8, "significant wave height" ×7), all 59 regions on `/regions`.

**2. JSON-LD — PASS.** Right schema per page type: `FAQPage` ×20 Q/A + `SpeakableSpecification` +
`BreadcrumbList` on `/faq` (`.faq-question`/`.faq-answer` exist on real elements); `Blog` +
`BlogPosting` on `/blog`; `BlogPosting`+`Person`+`Place` ×10+`BreadcrumbList` on the post;
`ItemList`+`SportsActivityLocation`+`GeoCoordinates` on `/spots`; `Place`+`Dataset`+
`BreadcrumbList` on the climatology page; `ItemList` (59) on `/regions`; `AboutPage`+`Person`+
`BreadcrumbList` on `/about`; `WebSite`+`Organization`+`SoftwareApplication` sitewide.

**3. sitemap.xml + llms.txt sync — 2 FIXED.** Sitemap now 1,457 URLs (was 745), regenerated today.
- **`/spots` (the directory index) was missing from `sitemap.xml`** — only its `/spots/{slug}`
  children were listed, although the page is live, canonical, and in `llms.txt`. Added a
  `spotsIndex` entry in `app/sitemap.ts` (weekly, priority 0.8, lastmod 2026-09-02 = the page's
  last real change per git).
- **`/about` (shipped 09-02) was missing from `llms.txt` Key pages.** Added.
- Observation, not acted on: `eleven-best-waves-for-longboarders` (RSS pubDate 2026-09-20 08:15Z)
  is on `/blog` and in the RSS feed but **not** in the sitemap (12 posts vs 13), even though the
  sitemap was regenerated 2026-09-21 06:31Z. `ALL_SLUGS_WITH_DATE_QUERY` has the same filters as
  the blog-index query, so this looks like stale-while-revalidate on the 1 h `getAllSlugsWithDate`
  data-cache entry on a low-traffic site — should self-heal. **Re-check next run;** if still
  missing, look at the fetch cache/tag strategy in `app/lib/sanity.ts`.
- `<lastmod>` values are pinned constants by design (`STATIC_LAST_MODIFIED` etc.), still plausible.
  `REGIONS_LAST_MODIFIED` (2026-08-26) and spot pages (2026-06-08) are getting old — bump when
  those routes get meaningful changes.

**4. Meta fundamentals — PASS.** title, meta description, canonical, `og:title/description/image/
site_name`, `twitter:card` present on all 8 pages. `/regions` og:image (fixed 08-31) is live. Minor:
`/climatology/[slug]` `og:image` is the generic `/api/og` with no title/subtitle (all other page
types have a page-specific card) — see open item 2.

**5. First ~150 words — PASS with notes.** Homepage lede ("Groundswell is a surf-forecast service:
live conditions and a 10-day wave forecast … 4+ years of swell history") and `/regions` intro
("… Nearly 60 regions — North Shore Oahu, the Mentawais, the Basque Country … world surf atlas")
are both now specific. **Previous open item 2 (thin `/regions` intro) is resolved**; previous open
item 1 (hardcoded `/regions/[slug]` meta description) is out of scope this run — not re-verified.

**6. robots.txt — PASS.** Unchanged: `Allow: /` + `/api/`, `/sign-in`, `/sign-up`, `/studio/`,
`/debug` disallows, sitemap referenced, no bot-specific blocks.

**7. Search presence — not re-checked this run** (no web-search tool available in this unattended
run). No change assumed from the last logged baseline (zero for brand + answered category queries).

**Open items needing a human judgment call (nothing edited — all are in-app translated copy):**
1. **Spot-count claims disagree with each other and with the data.** `/spots` meta description +
   `llms.txt` say "220+", the `/spots` OG card subtitle says "500+", and the page's JSON-LD
   `ItemList.numberOfItems` is **994**. Pick one honest number (probably derive it from
   `getAllSpots().length` instead of hardcoding) and put it through `t()` in all 5 locales; then
   update `llms.txt` to match. (`llms.txt` deliberately left at "220+" so it matches the live page
   until the app copy changes.)
2. **`/climatology/[slug]` opening text and OG card.** Visible text after the `<h1>` is a tiny data
   label ("3-year monthly avg · offshore significant wave height · 2022–2024") followed by a
   related-blog-card excerpt (for Pipeline: about *left-handers in general*), so there's no plain
   "what this page is / best season at {spot}" sentence in the first ~150 words, and its `og:image`
   has no per-spot title. A one-line localized summary + a per-spot `/api/og` URL would help.

**Fixed and committed locally** (branch `dev`, awaiting review + push):
- `seo: add /spots index to sitemap and /about to llms.txt`

**Housekeeping:** untracked `/.aiv_*.html` / `.aiv_*.xml` scratch files from earlier unattended
runs are still in the repo root (safe to `rm .aiv_*`). This run wrote no scratch files.

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

### 2026-09-03 addendum — the two overnight routine PRs merged + promoted (master `b6c7b61`)

- **PR #56 (edge-caching):** removed `cookies()` from `app/layout.tsx`. `/about`, `/terms`,
  `/privacy`, `/support`, `/blog` are now prerendered + edge-cached on prod
  (`X-Nextjs-Prerender: 1`, `X-Vercel-Cache: HIT`). **Open:** `/climatology/[slug]` +
  `/blog/[slug]` (~600 URLs) stay `no-store` — Next.js won't ISR-cache a route that reads
  `searchParams`, and both read `?lang=` for hreflang. Needs a locale-strategy call (drop
  server `?lang=` there / Partial Prerendering / middleware rewrite).
- **PR #57 (spot-page bundle):** `DeferredMount` defers the 3 spot-page Recharts charts;
  WaveChart fixed height. Local TBT −38%. **Ceiling found:** the biggest main-thread cost is a
  framework/vendor chunk on *every* route — separate bundle investigation. Spot-page LCP is a
  JS-gated hero heading (needs SSR'd initial report / layout hoist).
- **Next:** re-run this checklist + the full SEO/AI-visibility audit ~early Oct 2026. Watch
  retrievability (still zero for brand + answered category queries), whether the translated blog
  posts get indexed as separate localized results, and GSC coverage of `/climatology/*` once
  cacheable. Do the GEO spot-check (paste spot/climatology/blog URLs into ChatGPT + Perplexity).

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

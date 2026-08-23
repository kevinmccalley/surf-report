# Groundswell — AI Visibility Standing Checklist Log

Dated entries, newest first. Modeled on GoodStockPress's `docs/ai-visibility-log.md` / System #4
(`goodstockpress/docs/self-maintaining-systems.md`) — same 7-point checklist, adapted for
Groundswell's page types. This is a technical AI-crawler-readiness audit (raw-HTML crawlability,
structured data, meta fundamentals, answer-clarity) — **not** a "does ChatGPT mention us" check;
that's a separate, much fuzzier signal (see item 7 below) that stays informational until the site
has enough traffic/reviews for it to mean anything.

---

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

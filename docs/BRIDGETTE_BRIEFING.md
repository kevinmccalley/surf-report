# Groundswell — Bridgette's Briefing
*A living document maintained by Kevin + Kevin's Claude. Updated every time a feature ships.*
*Upload this to Laura's Claude Project to keep Bridgette current on Groundswell. Last updated: 2026-05-14.*

---

## What Is Groundswell?

**Groundswell** (groundswell.surf) is a surf conditions SaaS — real-time surf reports and 10-day forecasts for any break on earth. Kevin builds it; Laura handles marketing and content. It runs on Next.js 16, TypeScript, Vercel, Clerk auth, and Stripe payments.

**Core value prop:** Honest, global surf forecasts from open data sources (NOAA, ECMWF, Copernicus Marine) — no ads, no check limits, no paywalled models.

**Supported languages:** English, Spanish, French, Portuguese (Brazil), Portuguese (Portugal).

---

## Pricing Tiers

| Tier | Price | Key Features |
|---|---|---|
| **Free** | $0 forever | 3-day forecast, wave height/swell/wind/tides, surf rating, nearby spots, 1 saved location, all 5 languages |
| **Individual** | $4/month | Full 10-day forecast, 4+ years historical data, 608 live spots ("Best Surf Now"), full tide curve + NOAA verification, 400-day accuracy record, unlimited saved locations, weekly swell alert emails |
| **Premium** | Whitelist only | All Individual features + Session Planner (not publicly launched yet) |

**Key messaging:** "$4/month · No ads · No check limits · 7-day free trial · Cancel anytime · No card to start"

---

## The Blog

Groundswell launched a blog in May 2026 at **[groundswell.surf/blog](https://groundswell.surf/blog)**.

**Laura manages all blog content** via Sanity Studio at **[groundswell.surf/studio](https://groundswell.surf/studio)** (sign in with her Groundswell account).

**Full author guide:** `docs/groundswell-blog-guide.md` in this repo — covers Studio navigation, writing posts, image guidelines, SEO tips, and publishing workflow.

### Blog Categories
| Category | Slug | Use for |
|---|---|---|
| Wave Science | `wave-science` | How swells form, travel, break |
| Forecasting Tips | `forecasting-tips` | Reading Groundswell forecasts |
| Surf Spots | `surf-spots` | Featured breaks worldwide |
| Gear & Equipment | `gear-equipment` | Boards, wetsuits, accessories |
| Groundswell Updates | `groundswell-updates` | Product news, new features |
| Surf Culture | `surf-culture` | Lifestyle, travel, community |

### How Publishing Works
1. Laura writes and publishes in Sanity Studio → post goes live within ~60 seconds
2. No rebuild needed — blog uses Incremental Static Regeneration (60-second revalidation)
3. Future-dated posts schedule automatically
4. Featured post toggle → appears as the hero card on `/blog`

---

## SEO & Discoverability

- Sitemap at `groundswell.surf/sitemap.xml` — covers all static pages, 6,900+ climatology pages, and all blog posts
- RSS feed at `groundswell.surf/blog/rss.xml`
- JSON-LD structured data on all pages (WebSite, Blog, BlogPosting, Place)
- OG images dynamically generated for social sharing
- Titles and descriptions fully localized (all 5 languages) for international SEO
- Hreflang alternates on spot and climatology pages

---

## Email Automations (Loops.so)

Laura manages Groundswell's email sequences in Loops.so. Currently live:
- **Welcome email** — triggered on new sign-up
- **Weekly swell alert** — sent to Individual subscribers with their saved location forecast

Full Loops guide: `docs/loops-guide-laura.md` in this repo.

---

## Key URLs

| Resource | URL |
|---|---|
| Live app | groundswell.surf |
| Dev environment | dev.groundswell.surf |
| Blog | groundswell.surf/blog |
| Sanity Studio | groundswell.surf/studio |
| Accuracy page | groundswell.surf/accuracy |
| Loops.so | loops.so (Laura's login) |

---

## Tone & Brand Voice

- **Direct, confident, honest** — we don't oversell or use vague superlatives
- **Surfer-friendly, not bro-y** — speaks to serious surfers across all cultures
- **Data-first** — we cite sources and publish our accuracy stats publicly
- **Global perspective** — avoids California-centrism; 35 million surfers worldwide

**Key phrases that resonate:** "The ocean doesn't lie," "No ads. Ever," "Published accuracy stats," "Open data sources"

---

## What Bridgette Can Help With

- Drafting blog posts for Laura to edit and publish in Studio
- Writing email copy for new Loops.so automations
- Reviewing marketing copy for accuracy (check against this doc before publishing claims)
- Brainstorming content calendar ideas around surf seasons, swell events, and product updates
- Translating content — all 5 locales are supported

---

*Last updated: 2026-05-14*

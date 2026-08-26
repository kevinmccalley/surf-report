# Surf Regions — Feature Spec (draft v0.1)

Status: **scoped, not started.** Written 2026-08-23 to park the idea until there's headroom to build it.

## 1. The idea

Type "Indonesia" into search (or browse a dedicated section) and get a two-pane view: a list of that region's main spots on the left, a map with every one of those spots highlighted on the right. Regions range from country-scale ("Philippines," "Fiji") down to sub-national surf regions ("Southern California," "Baja South," "North Shore, Oahu"). As a bigger stretch, a fullscreen zoomable world map where regions light up on hover/rollover and are clickable, à la a surf atlas.

Three deliverables, roughly in build order:
1. **Region data + `/regions` section** — index page, detail page (list-left/map-right), each region seeded with its curated spot list.
2. **Search integration** — typing a region or country name surfaces it in the existing search dropdown alongside spots and geocoded places.
3. **Fullscreen interactive world map** — a `/regions/map`-style explorer, zoomable, hoverable, clickable, spot markers appearing as you zoom in.

## 2. What already exists (don't rebuild this)

- **`app/lib/spots-directory.ts`** already defines an 8-bucket continent-level taxonomy:
  ```ts
  export const REGIONS = ['Hawaii','North America','Latin America','Europe',
    'Africa & Atlantic','Indian Ocean','Southeast Asia','Oceania & Pacific'] as const
  export type Region = typeof REGIONS[number]
  ```
  and a `DirectorySpot` type (`name, locality, region, lat, lon, slug, href, waveType?, difficulty?, bestSeason?, wslBadge?, top100Rank?`) built by merging `app/lib/surf-spots.ts` (~250 curated spots), `app/lib/notable-spots.json`, and `app/top100/spots-data.ts`.
- **`app/spots/SpotsDirectoryClient.tsx`** already has continent filter chips over that 8-bucket taxonomy (`REGION_I18N` maps each bucket to a `t()` key) — this is the existing precedent to follow for the i18n pattern, not a v2 of what we're building.
- **Naming collision to resolve first:** the new "Baja South / North Shore Oahu" concept is a *different, finer-grained* thing than the existing `Region` type, which is really continent-level. Recommend renaming the existing type `Continent` (small mechanical rename, ~3 files) and introducing a new `SurfRegion` type for the granular concept below. Don't reuse the word "Region" for two different granularities in the same codebase.
- **No spot has a country field today** — only a free-text `locality`/`country` string (e.g. `"Santa Cruz, CA"`). Continent bucket is currently *derived* via regex/bbox heuristics (`regionFromCountry`), not stored. A real `SurfRegion` feature needs an explicit, curated spot→region mapping — the heuristic bucketing isn't precise enough to draw a line between "Baja North" and "Baja South."
- **Map (`app/components/SurfMap.tsx`)** is built around a single focal spot + small "nearby" dots; it tears down and rebuilds the Leaflet instance on lat/lon change. **There is no `fitBounds`, no clustering, no imperative ref for panning to a bounding box.** A region view (N spots, zoom-to-fit) needs new map logic — this is the biggest net-new engineering chunk, not the data or the routes.
- **Search (`app/components/SearchBar.tsx`)** debounces, merges local spot search with `/api/geocode`, and its `onSelect` typically triggers `fetchReport()` in place (SPA-style, stays on the current page) rather than navigating. A region result needs to branch differently — navigate to `/regions/[slug]` and fit-bounds the map, not fetch a single-spot report. Every consumer of `SearchBar` (`SurfApp.tsx`, `LandingHero.tsx`, `SiteHeader.tsx`, `MarketingLanding.tsx`) will need that branch.

## 3. Data model

```ts
interface SurfRegion {
  slug: string                // 'southern-california', 'baja-sur', 'north-shore-oahu'
  name: string                 // proper noun — not translated, like spot names today
  continent: Continent         // existing 8-bucket enum, renamed from Region
  country: string               // ISO 3166-1 alpha-2, e.g. 'US', 'MX', 'ID', 'PH'
  admin?: string                 // optional state/province, e.g. 'CA', 'BCS'
  center: { lat: number; lon: number }
  bounds?: [[number,number],[number,number]]  // optional curated bbox override
  spotSlugs: string[]           // references into existing DirectorySpot.slug
  searchAliases?: string[]      // e.g. 'SoCal' -> southern-california
  descriptionKey?: string       // CMS/localized copy, see i18n section
}
```

**Country-level search ("Indonesia") is not a separate entity.** It's a derived aggregate: filter all `SurfRegion`s by `country === 'ID'`, union their `spotSlugs` and bounding boxes on the fly. So typing "Philippines" (one region = whole country, per the user's sample list) resolves directly to that region; typing "Indonesia" (which the sample list implicitly splits into Bali / Mentawai / Sumatra / Java) resolves to a synthesized multi-region view. This avoids needing to model ~200 countries as first-class content — only the ~45–55 curated regions below need real content, and country becomes a query filter on top of them.

Given the scale (spot curation across ~50 regions, each needs a real center/bounds and a curated spot list, not a heuristic), this is naturally **Sanity content**, not a static TS array — batch-editable, and the existing project already runs Sanity for blog posts. Static TS arrays work for the ~8 continent buckets; they don't work well for 50 hand-curated regions with descriptive copy per region per locale.

## 4. Proposed region list

Matches and extends the user's sample list, organized under the existing continent buckets. Flagged: **Japan has no natural home in the current 8-bucket continent taxonomy** — needs a decision (add a 9th bucket, or fold into "Southeast Asia" under a renamed "Asia & Pacific Rim").

**Hawaii**
North Shore, Oahu · South Shore, Oahu · Maui · Kauai · Big Island

**North America**
Southern California · Central California · Northern California · Oregon · Washington · Florida · Outer Banks, NC · South Carolina · New Jersey/New York · New England

**Latin America**
Baja Norte · Baja Sur · Mainland Mexico Pacific · Costa Rica Pacific · Costa Rica Caribbean · Nicaragua · El Salvador · Panama · Puerto Rico · Barbados · Dominican Republic · Peru · Ecuador · Brazil South (Florianópolis) · Brazil Northeast · Uruguay

**Europe**
Portugal — Ericeira/Peniche · Portugal — Nazaré · Portugal — Algarve · Spain — Basque Country · France — Landes/Hossegor · France — Biarritz · UK — Cornwall · Ireland — West Coast · Canary Islands · Azores

**Africa & Atlantic**
Morocco — Taghazout · South Africa — Eastern Cape (J-Bay) · South Africa — Cape Town · Senegal · Cape Verde

**Indian Ocean**
Maldives · Sri Lanka · Mozambique · Réunion

**Southeast Asia**
Bali · Mentawai Islands · Sumatra/Nias · Java (G-Land) · Philippines — Siargao · Philippines — La Union

**Oceania & Pacific**
Australia — Gold Coast · Australia — Byron Bay/Northern NSW · Australia — Sydney/Southern NSW · Australia — Margaret River, WA · Fiji · Tahiti/French Polynesia · New Zealand

~50 regions total. Cross-check against blog metadata already in `docs/blog-articles/*.md` — spot slugs like `jeffreys-bay`, `hollow-trees`, `teahupoo`, `pipeline`, `mundaka`, `chicama`, `pavones`, `scorpion-bay` etc. already exist and map cleanly onto this list, so region→spot curation is largely "look up spots already referenced in the 14 blog articles" rather than starting from zero.

## 5. Pages/routes

- `/regions` — index, cards grouped by continent (reuse `SpotsDirectoryClient`'s chip/filter pattern).
- `/regions/[slug]` — detail: spot list left, `MapPanel`-style map right, fit-bounded to the region, all spots highlighted as markers. This is the core ask from the prompt.
- Country aggregate view: either `/regions/[slug]` handles a synthetic multi-region slug (e.g. `/regions/country-id`), or reuse the same component with a `country` query param — needs a decision, leaning toward query param to avoid double-routing.
- `/regions/map` (phase 3) — fullscreen explorer.

## 6. Map work required

This is the real engineering lift, not the content. `SurfMap.tsx` needs either a new sibling component (`RegionMap.tsx`) or a mode prop, supporting:
- `fitBounds()` over N spot coordinates on mount and on region change (no full remount).
- Multiple simultaneously-visible, labeled markers (current component only does one focal + faint "nearby" dots).
- Click-to-select behavior consistent with existing spot pages.

**Phase 3 fullscreen world map** — for the "rollover a region and it highlights" effect without sourcing real geographic/political boundary data (many of these regions, like "Baja South" or "Southern California," aren't official administrative units): compute a convex hull polygon over each region's member spot coordinates (e.g. via Turf.js `convexHull()`), cache it, and use that as the hover-highlight shape. Cheap, requires no GeoJSON boundary sourcing, and visually matches "the surf area" better than a political border would. Zoom-dependent marker/label reveal (region blobs at world zoom → individual spot pins once zoomed into one) can reuse Leaflet's built-in zoom event rather than needing a clustering plugin, since region count (~50) is small.

## 7. Monetization — subscriber-gated, teased for free

This is meant to double as a sales driver, not just a feature — worth designing the tease as carefully as the feature itself.

**What already exists to build on** (`app/lib/subscription.ts`, `getSubscriptionTier()`): three tiers, **free / individual / premium**, resolved server-side from Clerk `privateMetadata` (written by the Stripe webhook, never trusted from the client). Gating today is done two ways, both worth reusing rather than inventing a third pattern:
- **API-level 403**: e.g. `app/api/model-comparison/route.ts` — `if (tier !== 'premium') return 403`. Server routes never trust a client-sent tier for the paid path.
- **Client-side truncate + locked teaser panel**: e.g. `ForecastTimeline.tsx` shows real data up to a tier-based limit, then renders a locked column (dashed border, gradient wash, lock icon) as the last item — not a blur filter, a hard cutoff plus a visibly-locked "there's more" panel. `SurfApp.tsx` has two small reusable pieces of this pattern already: `UpgradeTeaser` (full-width CTA card) and `HistoricalGate` (compact inline locked row). Both just call a local `onUpgrade` → `setShowPaywall(true)`, which opens the existing `PaywallModal` (3-column free/individual/premium pricing, Stripe Checkout) — there's no dedicated `/pricing` route, upgrade is always modal-in-place.

**Tier structure — decided:**
- **Free**: the fullscreen world map itself (Phase 3) is free to browse — pan/zoom/hover, all ~50 regions light up. The map *is* the wow-factor and the best acquisition surface; gating it away entirely kills the thing that's supposed to sell the upgrade. Clicking into a region is where the gate lands: free users see spot names/count for any region but a locked map/detail (`HistoricalGate`-style inline lock row: "12 spots in Baja Sur — Upgrade to unlock"), except **1–2 flagship regions** (e.g. North Shore Oahu, Southern California) which are fully open as a genuine sample — mirrors `ForecastTimeline`'s "show N, lock the rest" shape, applied at the region level instead of the day level.
- **Individual**: picks **5 regions of their choosing** to fully unlock (spot list + map + static spot info) — a small "My Regions" picker UI, selection stored per-user (Clerk `privateMetadata` is fine at this size — 5 slugs — no new table needed). Worth deciding up front whether the selection is swappable (e.g. once a month) or locked in — swappable is more generous and still creates upgrade pressure once someone wants a 6th; locked-in is simpler to build. Lean swappable, low cost either way.
- **Premium**: full unlock of all ~50 regions, **plus live swell/wind conditions overlaid on every spot pin**, not just static info. This is the deluxe differentiator — individual's 5 regions show name/wave-type/difficulty/best-season (static), premium's full-world access shows the same live conditions data the core product already sells, just fanned out across every spot in every region simultaneously. Reframes premium as "the whole world, live" rather than just "the whole world, bigger number" — ties the upgrade to the product's actual value prop instead of a row count.
  - **Engineering note**: today's live-conditions fetch (`app/api/surf/route.ts`) is single-location. Rendering live conditions across every spot in every region (~250 spots total) on demand would be expensive and slow if done as N live fetches per page load. This needs a batched/cached layer — e.g. a periodically-refreshed snapshot per spot (many spots already get scheduled/cached forecast data for the main product) rather than fetching live per-request per pin. Flag this as real scope, not a trivial "just call the existing API in a loop."
- **Search integration**: a region/country match in the dropdown is always visible to free users (don't hide that the feature exists) but selecting a locked region routes into the teased detail page rather than the full one — search itself becomes a discovery/upsell surface.
- **SEO angle worth not losing**: this project already has significant SEO/GEO investment (per project memory — schemas, `/faq`, locale handling). A public, crawlable, unlocked *summary* of each region (name, spot count, a couple sample spot names, no live map/conditions) is good top-of-funnel content and consistent with how the free flagship regions above would work — don't make the whole `/regions` index route require auth, only the payoff (live map + full spot list) per locked region.

## 8. i18n

Per project convention, region **names** are proper nouns (like spot names today) and don't go through `t()`. Region **descriptions/blurbs** are user-visible prose and do need translation — at ~50 regions × 5 locales, that's real content work, best done as localized Sanity fields (mirroring how blog posts already handle localization) rather than flat `en.ts`/`es.ts` string entries. Only UI chrome (section headers, "Browse all regions," filter labels, lock-panel copy) goes through the standard `t()` + all-5-locale-files pattern, following `SpotsDirectoryClient.tsx`'s `REGION_I18N` precedent.

## 9. Phased build order

1. Rename `Region` → `Continent` (mechanical, low-risk, unblocks the naming collision).
2. Sanity schema for `SurfRegion` + seed ~50 regions with curated `spotSlugs` (mine from existing blog article "Featured Surf Spots" fields as a starting set).
3. `RegionMap.tsx` with `fitBounds` + multi-marker support.
4. `/regions` index + `/regions/[slug]` detail pages, with the free/locked split from §7 built in from the start (not bolted on after).
5. Search integration (region/country match branch in `SearchBar` consumers), including the locked-region routing behavior.
6. Individual's "My Regions" picker (5-slug selection UI + storage) — ungates the feature for the paid-but-not-premium tier.
7. Phase 3: fullscreen zoomable world explorer with convex-hull hover highlighting — free-to-browse per §7.
8. Premium's live-conditions-per-spot batched/cached data layer — the biggest single chunk of net-new backend work in the whole spec; scope and build separately once §6–7 prove the feature has legs.

## 10. Open questions for Kevin

- Japan's continent bucket — new 9th bucket, or fold into a renamed Asia bucket?
- Should South Africa be one region or split (Eastern Cape vs. Cape Town) — sample list said "could be broken into many regions."
- Country-aggregate view: dedicated route vs. query param on the region detail page?
- Is Sanity the right home for region content, or should this stay in a static TS file like `surf-spots.ts` given ~50 is a bounded, rarely-changing list? (Leaning Sanity for the localized-description reason above, but worth confirming given it adds a CMS dependency the current spot data doesn't have.)
- Which 1–2 regions are the free "flagship" samples?
- Individual's 5-region picks: swappable periodically, or locked in once chosen? (§7 leans swappable)
- Premium's live-conditions-per-region needs a batched/cached data layer (§7 engineering note) — worth scoping as its own mini-project before committing to it as the premium hook, since it's more work than the rest of the feature combined.

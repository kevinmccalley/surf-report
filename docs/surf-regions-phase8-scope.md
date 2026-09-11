# Surf Regions — Phase 8 scope: premium live-conditions layer

Status: **built (MVP), on `dev`.** Decisions below resolved 2026-08-26.

Decisions taken:

1. **Standalone 6-hourly cron**, free tier — *not* folded into epic-now (the two
   spot lists overlap on only 1 of 178, so folding in saves nothing) and *not*
   the €29/mo Open-Meteo commercial plan. 3h refresh later = set
   `OPEN_METEO_API_KEY`, no code change.
2. **Region detail maps only.** The world-atlas break pins stay a free browse
   layer.
3. **Coloured pins + wave/period/wind tooltip**, plus the same compact line in
   the panel's break list. No "best right now" sorted list (possible follow-up).
4. Shipped as Phase 8 now.

Follow-ups noted: respect the ft/m toggle in the tooltip (app has no persisted
units pref today — using ft, the app-wide default); world-map pins; "best in
region now" list.

## 1. What Phase 8 is (spec §7)

For **premium** users, every break pin on the region maps and the world atlas
shows **live swell + wind + a rating**, not just a name. It reframes premium as
"the whole world, live" instead of "the whole world, bigger number" — tying the
upgrade to the product's actual value prop.

- Individual tier: their 5 regions show static info (name / wave-type /
  difficulty / best-season). Unchanged.
- Premium: same maps, but pins are colored by current rating and the
  tooltip/popup shows wave height, period, swell direction, wind.

## 2. The good news — the pattern already exists

`app/api/cron/epic-now/route.ts` already does the hard part in production:

- Sweeps **450 spots** (`notable-spots.json`), 2 Open-Meteo calls each,
  `runWithConcurrency(20)`, inside Vercel's `maxDuration = 300`.
- Runs `computeSurfRating` + `findCalibration`/`applyCalibration` per spot.
- Writes one JSON snapshot to Redis (`rset('epic-now', data, 6h)`).
- Cron `0 */3 * * *` (every 3 h) in `vercel.json`.
- Read endpoint `app/api/epic-now/route.ts` — tier-gated (`free` → 401),
  `Cache-Control: private, max-age=900, stale-while-revalidate=1800`.

Phase 8 is **the same shape, narrower spot set, richer per-spot payload, pin
rendering on the maps**. No new infrastructure — Redis, the cron runner, the
concurrency helper, the rating pipeline, and the Open-Meteo proxy (`omUrl`) are
all in place.

## 3. Spot universe + request budget

| Set | Count | Notes |
|---|---|---|
| `notable-spots.json` (epic-now today) | 450 | |
| Catalog spots (`surf-spots.ts`) | 185 | |
| **Unique breaks across all 59 regions** | **~178** | `getWorldSpots()` — this is Phase 8's set |

Phase 8's sweep (~178 spots) is **smaller than epic-now's** (450), so runtime
fits the same 300 s budget with room to spare.

**Open-Meteo call budget is the real constraint.** Free tier ≈ 10,000 calls/day.

| Consumer | Calls/day (approx) |
|---|---|
| `epic-now` cron | 450 × 2 × 8 runs = **7,200** |
| Per-user `/api/surf` (page loads) | variable, cached 30 min per spot |
| **Phase 8 cron @ 2 calls/spot, every 3 h** | 178 × 2 × 8 = **2,848** |
| **Phase 8 cron @ hourly** | 178 × 2 × 24 = **8,544** |

epic-now alone is already close to the free ceiling. Adding Phase 8 **requires
the Open-Meteo commercial plan** — the "Professional" tier is ~€29/mo for
100k calls/day (verify current pricing). `omUrl()` already appends
`OPEN_METEO_API_KEY` when set, so the code change is zero; it's a billing
decision.

Alternative: **share one sweep.** Fold Phase 8 into the epic-now cron — it
already fetches marine+weather for a superset of spots; widen its output to keep
*every* checked spot's conditions (not just the top 12 "epic" ones) in a second
Redis key. That removes the incremental call cost entirely, at the price of
coupling the two features' spot lists and refresh cadence (3 h).

## 4. Proposed architecture

### 4a. Collection — `app/api/cron/region-conditions/route.ts`

- Input: `getWorldSpots()` (slug, lat, lon per break).
- Reuse `checkSpot()` logic from epic-now almost verbatim, but **don't filter**
  by rating — keep every result.
- `runWithConcurrency(20)`, `maxDuration = 300`.
- Output: `Record<slug, SpotConditions>` → `rset('region-conditions', snap, 4h)`.
- Cron: `0 */3 * * *` (matches epic-now; bump to hourly only if we go commercial
  and it's worth it).
- **Preferred: merge into the epic-now cron** per §3 rather than a second cron —
  one Open-Meteo sweep, two Redis writes.

### 4b. Read — `app/api/regions/conditions/route.ts`

- `GET` → `getSubscriptionTier()`; `tier !== 'premium'` → `403 {error:'tier'}`.
- Returns the whole snapshot (`~178` small objects ≈ 20–30 KB JSON).
- `Cache-Control: private, max-age=600, stale-while-revalidate=1800`.
- Add `/api/regions/conditions(.*)` to `middleware.ts` public matcher? No —
  it's premium-gated, leave it auth'd.

### 4c. UI

- `RegionDetailClient` / `WorldMapClient`: if premium, fetch the snapshot once on
  mount, pass a `conditions?: Record<slug, SpotConditions>` prop down to
  `RegionMap` / `WorldRegionsMap`.
- `RegionMap` markers: when `conditions[slug]` exists, tint the numbered pin by
  `ratingLabel` (reuse `rating.color` from `computeSurfRating`) and put
  `waveHeight · period · windSpeed` in the tooltip.
- `WorldRegionsMap` break pins (the zoomed-in layer): same treatment; the
  region blobs stay as-is.
- Non-premium: no fetch, pins unchanged. A small "Live on premium" hint on the
  world map is a possible upsell surface (optional).

## 5. Data shape

```ts
interface SpotConditions {
  waveHeight: number      // m, swell
  wavePeriod: number      // s
  swellDir: number        // deg
  swellDirLabel: string
  windSpeed: number       // km/h
  windDir: number         // deg  (epic-now doesn't keep this today — add it)
  score: number
  ratingLabel: string     // FLAT | POOR | ... | EPIC
  updatedAt: string       // ISO, snapshot time
}
```

Basically `EpicSpot` minus `name/lat/lon` (known from region data), plus
`windDir` and `updatedAt`.

## 6. Cost summary

| Item | One-time | Recurring |
|---|---|---|
| Code (cron + read + UI wiring + tests) | ~1 build session | — |
| Open-Meteo commercial plan | — | ~€29/mo (skippable if we share the epic-now sweep) |
| Redis | — | $0 (existing, one more key ~30 KB) |
| Vercel | — | $0 (existing cron slot or fold into epic-now) |

## 7. Open questions / decisions for Kevin

1. **Separate cron + Open-Meteo commercial plan, or fold into the epic-now
   sweep** (free, but couples cadence to 3 h and spot list to `notable-spots`)?
   → Leaning **fold in**: widen epic-now to also write an all-spots-conditions
   key. Zero incremental cost, 3 h freshness is fine for a "live-ish" map.
2. Refresh cadence — 3 h (piggyback) vs hourly (needs commercial)? 3 h is
   probably fine; surf conditions don't swing violently hour to hour and the
   per-spot `/api/surf` page still gives the precise, on-demand read.
3. Does the world-map break-pin layer (only visible at zoom ≥ 5) even need this,
   or is live conditions enough on the **region detail** maps? Narrower scope =
   detail maps only, world map stays a browse/discovery surface.
4. Is "colored pins + richer tooltip" the whole premium deliverable, or do we
   also want a sortable "best in this region right now" list in the panel?
5. Ship it as Phase 8, or is this a "later, if the feature has legs" item —
   Phases 1–7 are the feature; this is the premium sweetener.

## 8. Recommendation

**Minimum viable Phase 8:** fold an all-spots conditions snapshot into the
existing epic-now cron (no new Open-Meteo cost), add a premium-gated read
endpoint, and light up the **region detail** map pins (colored + wave/wind
tooltip). Leave the world-atlas break pins as a free browse layer. Revisit
hourly refresh / commercial Open-Meteo only if usage shows people want it.

That's ~1 build session, $0 recurring, and it delivers the "premium = live"
reframe without the €29/mo commitment or a second cron.

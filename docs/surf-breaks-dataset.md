# Surf-breaks coordinate dataset

A curated, versioned, self-maintained list of surf breaks with **accurate GPS
coordinates for the actual takeoff zone** — not the town, not the car park, not
the beach access. Coordinates of a wave don't change, so this is a fixed dataset
we hunt down once, cross-check against multiple sources, and then only ever
extend.

- **Data:** `app/data/surf-breaks.json`
- **Types + accessors:** `app/lib/surf-spots.ts` (`getAllSpots`, `findSpotBySlug`, `searchSurfSpots`)
- **Integrity guard (CI):** `app/lib/__tests__/surf-breaks-data.test.ts`
- **Verification tooling:** `scripts/coord-audit/` (isolated — its own `npm install`)

## Record schema

```jsonc
{
  "name": "Pipeline",
  "aliases": ["Banzai Pipeline", "Pipe"],
  "country": "North Shore, Oahu",   // free-form "locality, region" label (historical field name)
  "lat": 21.6649,
  "lon": -158.0530,
  "type": null,          // reef | point | beach | rivermouth | slab | null
  "direction": null,     // left | right | both | null
  "confidence": "legacy", // legacy | provisional | verified
  "sources": [],          // e.g. ["wannasurf", "surfline", "osm-water-audit"]
  "verifiedOn": null      // "YYYY-MM-DD" of last verification, or null
}
```

`type` / `direction` are nullable and get filled opportunistically during
verification — they're not blocking.

### `confidence`

| value | meaning |
|---|---|
| `legacy` | Pre-dataset value. Never independently checked. `verifiedOn` must be `null`. |
| `provisional` | Placed/moved and confirmed to sit on water (or within ~40 m of the waterline) via the OSM water audit, **but not yet reconciled against 2+ independent gazetteers**. Must cite `sources` + `verifiedOn`. |
| `verified` | Agrees (within ~150 m) with **two or more** independent sources — Surfline, WannaSurf, Wikipedia/Wikidata, OSM `natural=reef` / `sport=surfing`, published break guides. Must cite `sources` + `verifiedOn`. |

The CI guard enforces the `legacy` ⇒ no-date and non-`legacy` ⇒ has-sources+date rules.

## The verification pipeline

For each break, in order of trust:

1. **OSM water audit** — `scripts/coord-audit/audit.mjs`. Point-in-polygon against
   the OpenStreetMap planet (Protomaps PMTiles, read over HTTP range requests).
   Tells you definitively *wet vs dry* and roughly how far inland. The OSM
   coastline is generalised, so treat distances as ±75 m near complex coasts —
   trust `IN_WATER` / `INLAND` / `NO_WATER`, eyeball `CLOSE`.
2. **Surfline cross-reference** — `scripts/coord-audit/xref-surfline.mjs`. Nearest
   name-matched entry in the repo's existing ~6,900-spot Surfline list
   (`app/lib/surf-spots.json`). A second independent opinion.
3. **Gazetteers** — WannaSurf publishes deg/min GPS for most named spots;
   Wikipedia/Wikidata for the famous ones; break guides (Stormrider, Surfline
   spot pages) for the rest.
4. **Manual eyeball** — for anything still ambiguous, place it on satellite
   imagery at the visible break (whitewater line / reef edge / point).

A coordinate reaches `verified` when **≥2 of (2)–(4) agree within ~150 m** and
the water audit is `IN_WATER` or `SHORE_OK`.

### Running the tools

```sh
cd scripts/coord-audit
npm install            # isolated — does NOT touch the app's dependencies
node audit.mjs --json audit-report.json
node xref-surfline.mjs
```

## Batch workflow + the ratchet

Growth and cleanup happen in batches (a region or ~30–50 breaks at a time):

1. Add / re-place coordinates in `app/data/surf-breaks.json`.
2. Run `audit.mjs` — nothing may be `INLAND` / `NO_WATER`.
3. Run `xref-surfline.mjs` + gazetteer checks; set `confidence`, `sources`,
   `verifiedOn`, and `type` / `direction` where known.
4. Lower `MAX_LEGACY` in `surf-breaks-data.test.ts` by the number of `legacy`
   rows you cleared. It's a one-way ratchet — the count can only go down.
5. `npm run test:run`, commit to `dev`.

### Seed state (2026-08-26)

182 breaks migrated from the old inline array. A first audit flagged ~50 as
150 m+ inland (worst: Witch's Rock 2.4 km, Cloud 9 ~15 km, First Point Malibu
~10 km). Those 50 were re-placed and water-audited → `provisional`. Remaining
132 are `legacy` and untouched. `MAX_LEGACY = 132`.

## Roadmap

- **To ~500 breaks:** keep every existing spot, add well-known breaks ranked by
  prominence. Each new one goes in at `provisional` minimum (audited wet) and is
  chased to `verified`.
- **Eventually:** every catalogued break on the planet. The dataset is small in
  bytes and never churns once a coordinate is right.

### Idea: dense regional maps from the Surfline set

The repo already carries ~6,900 Surfline-derived spots in `app/lib/surf-spots.json`
(name + lat/lon only). Today the regional maps only plot the handful of curated
breaks per region. We could layer **all** nearby Surfline spots onto each region
map as lightweight secondary pins — so a region shows dozens of breaks, not
three — with the curated dataset as the "featured" spots (named, rated, linked)
and the Surfline points as unobtrusive "more breaks here" markers. Needs: a
region ⇢ Surfline-spot spatial filter (reuse the region hulls from
`app/lib/region-hull.ts`), pin de-duplication against the curated set, and a
zoom threshold so they only appear when you're zoomed into a region. The
Surfline coordinates are un-audited, so they'd render as a distinct, secondary
pin style — not promoted to the curated dataset without going through the
pipeline above.

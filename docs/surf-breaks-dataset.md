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

## Batch log

| date | commit | batch | effect |
|---|---|---|---|
| 2026-08-26 | `c31c7e4` | seed | 182 breaks, 50 gross-error fixes → `provisional`. `MAX_LEGACY` 132. |
| 2026-08-27 | `da6f52f` | Réunion | St. Leu + Trois Bassins (the original bug report) re-placed onto the reef via WannaSurf + surf-forecast. `MAX_LEGACY` 132 → 130. |
| 2026-08-27 | `b549894` | Rincón / Aguadilla PR cluster | 5 `ai-placement` spots cross-checked. Gas Chambers + Wilderness were the wrong town (~14 km — moved Rincón → Aguadilla). Maria's Beach ~750 m off; "Rincon" (name-collided with Carpinteria) → "Domes". type/direction filled, real sources. No `legacy` cleared. |
| 2026-08-27 | `5d9fbff` | Full Surfline xref + Northern California expansion | Ran `xref-surfline.mjs` across all 182: 8 corroborated <150 m, 51 <500 m, 53 name-matches >1 km (mostly name collisions — e.g. Macaronis, Chickens, Pantin — but real errors flagged: Pascuales/Outer Banks name-match ~19 km), 44 no match. **Finding: the repo Surfline list (`app/lib/surf-spots.json`, 6,914) is patchy — 0 Réunion/Mauritius, and NorCal has only 44 entries, missing Mavericks / Ocean Beach SF / the whole SF-Marin coast.** So NorCal was hand-curated: **+21 spots** (Montara, Rockaway, Gray Whale Cove, Bolinas, Stinson, Rodeo Beach, Cowell's, The Hook, 26th Ave, Davenport Landing, Scott Creek, Waddell Creek, Four Mile, Natural Bridges, Capitola, Manresa, Asilomar, Carmel Beach, Point Arena, Salmon Creek, Dillon Beach), all water-audited wet → `provisional`. Dataset 182 → 203. Deferred: Linda Mar / Pacifica State Beach (tile source went flaky mid-audit). |
| 2026-08-27 | `176a86c` | Southern California grow (MODE B) | **+16 spots** (Jalama, Sandspit, Campus Point, Hammond's, Pitas Point, County Line, Point Dume, Topanga, Lunada Bay, Torrance Beach, The Wedge, Doheny, Oceanside Pier, Cardiff Reef, Scripps, Sunset Cliffs), all water-audited wet → `provisional`. Dataset 203 → 219. SoCal 14 → 30. Deferred: Zuma Beach, Venice Breakwater (tile source dropped out before the seaward nudge could be re-audited). |
| 2026-08-27 | `3430641` | Central California grow (MODE B) | **+8 spots** (Garrapata, Andrew Molera, Sand Dollar Beach, Moonstone Beach/Cambria, Cayucos Pier, Morro Strand, Pirate's Cove/Shell Beach, Point Sal), water-audited wet in the one clean run before data.source.coop began rate-limiting the session. Dataset 219 → 227. Central Coast 1 → 9. **Deferred (INLAND, need a seaward nudge + re-audit):** Willow Creek, San Simeon/Pico Creek, Morro Rock, Spooner's Cove, Grover Beach/Oceano, Surf Beach (Lompoc). |
| 2026-08-27 | `360e1b4` | Oahu North Shore verify (MODE A) | Cross-checked 8 spots vs WannaSurf + Wikipedia. **Pipeline** tightened to 21.6641,-158.0539 (Wikipedia + latitude.to agree <50 m) → `verified`. **Waimea Bay** tightened to 21.642,-158.0648 (WannaSurf + Wikipedia bracket it) → `verified`, type `point`. **Haleiwa** moved 21.5928,-158.1034 → 21.5941,-158.1082 (WannaSurf, ~520 m — old pin was toward town). Backdoor / Off The Wall / Sunset Beach / Laniakea / Rocky Point: coords kept (all audit wet), `type`+`direction` filled, real sources. **7 `legacy` cleared → `MAX_LEGACY` 130 → 123.** Now 123 legacy / 102 provisional / 2 verified. |
| 2026-08-27 | `a92f6f1` | Portugal grow (MODE B) | **+12 spots**, all water-audited IN_WATER/SHORE_OK → `provisional` (2 open-ocean control points passed on every audit run). Carcavelos, São Julião, Foz do Lizandro (rivermouth), Baleal, Molhe Leste (Peniche), Costa da Caparica, Matosinhos, Espinho, Cabedelo (Viana do Castelo), Arrifana (point/right), Praia do Amado, Zavial (reef/right). Coords from WannaSurf deg/min (Carcavelos, Foz do Lizandro, Arrifana) + surf-forecast + editorial placement. Portugal 6 → 18. No `legacy` cleared — `MAX_LEGACY` stays 123. Dataset 227 → 239. **Deferred:** Praia Grande (Sintra) — OSM water polygon at that cliff-backed cove is generalised, audit stuck at CLOSE 74–124 m across 3 nudges. |
| 2026-08-27 | _(pending)_ | Bali verify (MODE A) | 6 breaks cross-checked vs WannaSurf deg/min + Wikipedia + surf-forecast (2 control points passed). **4 big moves off the wrong spot:** Uluwatu −8.8292,115.0849 → **−8.8166,115.0863** (old pin was at the temple, ~1.4 km south of the break); Padang Padang → **−8.8111,115.1012** (old was ~1.5 km inland on the plateau); Bingin → **−8.8041,115.1133** (old ~2.3 km inland) + dropped bogus "Impossibles" alias; Keramas → **−8.5976,115.3391** (old was ~8.5 km off); Medewi → **−8.4278,114.7905** (old was ~16 km WSW in open sea). Canggu coord kept (SHORE_OK 4 m), Echo-Beach alt tested INLAND. All `type`/`direction` filled; sources upgraded off `ai-placement`/none. **5 `legacy` cleared → `MAX_LEGACY` 123 → 118.** |

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

**Caveat (found 2026-08-27):** this list is uneven. Whole regions are missing
(0 entries for Réunion/Mauritius) and even well-covered coasts have big gaps —
Northern California has 44 entries with no Mavericks, no Ocean Beach SF, and
almost nothing on the San Francisco–Marin coast. It's a useful corroboration
source and a decent secondary layer where it's dense, but it can't be the engine
for growing the curated set — that stays hand-curated + audited.

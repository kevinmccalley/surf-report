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

## Groundtruthing — the practice

The dataset is maintained by a recurring job called **the groundtruth pass**.
"Ground truth" is the mapping term for checking data against physical reality —
which is exactly what half of this job does. It runs in alternating modes:

- **Groundtruth · Verify** (MODE A) — check pins we already have against reality.
- **Groundtruth · Grow** (MODE B) — add new pins, held to the same reality check.

### The trust ladder every break sits on

| Rung | In plain terms |
|---|---|
| **legacy** | A pin we inherited and have *never checked*. Could be perfect, could be a kilometre inland. |
| **provisional** | We've put eyes on it: found it in an outside reference, dropped the pin there, and a script confirmed the pin actually lands on water. |
| **verified** | Two or more *independent* maps agree on the spot within ~150 m, and the water check passes. |

The whole practice is about moving breaks *up* this ladder and never letting them
slip down.

### What one run does

Runs alternate — one grows, the next verifies.

**Grow run (MODE B):**

1. Pick a stretch of coast that shows only a few breaks today.
2. Write down 8–15 famous breaks there that we're missing.
3. Look up each one's coordinates in outside sources — WannaSurf, Wikipedia,
   surf-forecast.
4. Run every candidate through the **water audit**: a script that checks the pin
   against OpenStreetMap's water layer and asks "is this point actually in the
   ocean?" Every run includes a known-good control point (Pipeline reef). If the
   control comes back dry, the map tiles didn't load — the whole run is thrown
   away rather than trusted.
5. Keep only pins that land in water (or within ~40 m of shore). Drop the rest.
6. Check for collisions — no duplicate name, nothing within 25 m of a break we
   already have.
7. Add the survivors as **provisional**, stamped with today's date and which
   sources were used.

**Verify run (MODE A):**

1. Take a cluster of 5–8 existing pins in one region — especially the oldest
   **legacy** ones.
2. Pull up each break's location in 2–3 independent references.
3. Compare to our pin. Move it *only* if a reference clearly contradicts us —
   wrong town, more than ~300 m off, or the water check says it's on land. A
   40–150 m difference on a messy coastline is left alone; that's within noise.
4. Fix wrong labels and bad aliases; fill in missing wave type (reef/point/beach)
   and direction (left/right).
5. Promote to **verified** only if ≥2 sources agree within ~150 m *and* the water
   check passes. Otherwise it stays provisional, but now with real sources
   attached instead of a guess.
6. If any **legacy** pins got cleared, tighten the ratchet (see below).

### Guardrails that run automatically on every push

- A **CI test** (`surf-breaks-data.test.ts`) fails the build if: a coordinate is
  missing decimals, two breaks sit on top of each other, a name won't turn into a
  URL, or a provisional/verified row has no source or date.
- The **legacy ratchet** (`MAX_LEGACY`): the test records the count of
  never-checked pins and fails if that number ever goes *up*. It's a one-way
  valve — the pool of unverified data can only shrink.
- Only the data file, its test, and this doc are ever committed — never a blind
  `git add -A`.
- Every change lands on **dev** first, waits for CI to go green, and only reaches
  production when the maintainer says so.
- Every run appends a row to the **batch log** below, so the same cluster never
  gets re-vetted by mistake.

### Why this grows the data intelligently

It never trusts one source (agreement between independent maps is the bar), it
never trusts itself (a machine check confirms every pin is physically on water),
and it can't quietly rot (the ratchet guarantees the unverified pile only gets
smaller). Half of each run's effort extends reach into new coastline; the other
half deepens confidence in what's already there.

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
| 2026-08-27 | `bd7666b` | Bali verify (MODE A) | 6 breaks cross-checked vs WannaSurf deg/min + Wikipedia + surf-forecast (2 control points passed). **4 big moves off the wrong spot:** Uluwatu −8.8292,115.0849 → **−8.8166,115.0863** (old pin was at the temple, ~1.4 km south of the break); Padang Padang → **−8.8111,115.1012** (old was ~1.5 km inland on the plateau); Bingin → **−8.8041,115.1133** (old ~2.3 km inland) + dropped bogus "Impossibles" alias; Keramas → **−8.5976,115.3391** (old was ~8.5 km off); Medewi → **−8.4278,114.7905** (old was ~16 km WSW in open sea). Canggu coord kept (SHORE_OK 4 m), Echo-Beach alt tested INLAND. All `type`/`direction` filled; sources upgraded off `ai-placement`/none. **5 `legacy` cleared → `MAX_LEGACY` 123 → 118.** |
| 2026-08-27 | `9123f26` | France grow (MODE B) | **+15 spots**, all water-audited IN_WATER/SHORE_OK → `provisional` (3 open-ocean control points passed on every run). Hossegor La Nord + La Sud; Seignosse Les Bourdaines + Les Estagnots; Capbreton La Piste (beach/right); Anglet Les Cavaliers + Les Sables d'Or; Guéthary Parlementia (reef/right) + Avalanche (reef/right) + Cenitz; Lafitenia / St-Jean-de-Luz (point/right); Hendaye; La Torche (Brittany); Vieux-Boucau; Moliets. Coarse coords from surf-forecast.com/breaks (Les Estagnots, La Piste, Les Cavaliers, Parlementia, Lafitenia) + editorial placement for the rest. France (mainland) 6 → 21. No `legacy` cleared — `MAX_LEGACY` stays 118. Dataset 239 → 254. **Deferred:** Le Penon (Seignosse) — OSM water polygon there is generalised, audit swung INLAND 168 m / CLOSE 77 m across 2 nudges. |
| 2026-08-27 | `297e161` | Mentawai + Desert Point verify (MODE A) | 6 `legacy` breaks cross-checked vs WannaSurf deg/min + surf-forecast; all audited IN_WATER/SHORE_OK (3 of 4 control points wet — the Macaronis one landed on an islet). **5 of 6 were badly scrambled (45–90 km off, wrong island):** Macaronis −2.592,99.854 → **−2.7887,99.9919** (Pasongan Bay, N Pagai — old was ~25 km NW); HT's / Lance's Right −1.962,99.622 → **−2.3756,99.8596** (Katiet, S Sipora — old was ~50 km NW); Rifles / Kandui Right −2.459,99.864 → **−1.9207,99.3194** (Nyang Nyang / Playgrounds — old was ~78 km SE); Bank Vaults −2.442,99.873 → **−1.8521,99.2447** (Nyang Nyang — old ~87 km SE); E-Bay −2.021,99.631 → **−1.8289,99.2543** (Nyang Nyang / Pulau Masokut — old ~45 km SE) + fixed bogus "Lance's Left" alias (E-Bay is a Playgrounds left, not the Katiet one) → "Ebay". Desert Point (Lombok) −8.7558,115.8139 → **−8.7510,115.8227** (WannaSurf, ~1 km onto the reef point). All `type` `reef` + `direction` filled; sources off empty. **6 `legacy` cleared → `MAX_LEGACY` 118 → 112.** |
| 2026-08-27 | `15bdbec` | Morocco / Agadir corridor grow (MODE B) | **+11 spots**, all water-audited IN_WATER/SHORE_OK → `provisional` (3 open-Atlantic control points passed). Boilers (point/right, Taghazout N end), Mystery Point (reef/right), Panorama (point/right), Devil's Rock (beach/right, Tamraght), Cro Cro (beach/both), Banana Point (point/right, Aourir), Anza (reef/both, Agadir), Imsouane Bay (point/right) + Cathedral Point (point/right, Imsouane), Tamri (beach/both), Sidi Kaouki (beach/both). Coords from WannaSurf deg/min; Mystery Point + Panorama + Tamri re-placed editorially (WannaSurf had Mystery/Panorama geocoded onto Taghazout village ~2 km E, Tamri 127 m inland of the river-mouth delta). Morocco 5 → 16. No `legacy` cleared — `MAX_LEGACY` stays 112. Dataset 254 → 265. |
| 2026-08-28 | `f8bc916` | Peru + Chile Pacific coast verify (MODE A) | 8 breaks cross-checked vs WannaSurf deg/min + surf-forecast.com; all audit IN_WATER/SHORE_OK (5 open-Pacific control points passed). **Moves:** Chicama −7.7,−79.45 → **−7.705,−79.4523** (legacy placeholder → El Point, WannaSurf); La Herradura (Lima) −12.1654,−77.0286 → **−12.1803,−77.0378** (was ~1.9 km NE at the wrong end of the bay — WannaSurf puts it on the south point); Punta de Lobos −34.4315,−72.0495 → **−34.4237,−72.0478** (~880 m N onto the point, WannaSurf+surf-forecast agree); "Pichilemu" −34.3936,−72.0016 (INLAND 134 m) → renamed **La Puntilla** (aliases Pichilemu, Punta de Pichilemu) at **−34.3797,−72.0133** (SHORE_OK, WannaSurf point); "Arica" → renamed **El Gringo** (aliases Arica, Chilean Pipeline) −18.4928,−70.3283 → **−18.4813,−70.3329** (reef by ex-Isla Alacrán, WannaSurf+surf-forecast). **Kept coord, relabelled:** Lobitos nudged −4.4528,−81.2845 → −4.4518,−81.2862 (reef/left); Mancora (alias Máncora) point/left, coord held; "Iquique" → renamed **El Colegio** (aliases Iquique, Punta Uno) reef/right, coord held (matches surf-forecast). All 8 off `ai-placement`/empty → real sources; `type`/`direction` filled. None promoted to `verified` — every corroborating gazetteer beyond WannaSurf only publishes 2-decimal coords (>150 m agreement band). **3 `legacy` cleared (Chicama, La Herradura, La Puntilla) → `MAX_LEGACY` 112 → 109.** Dataset stays 265 (109 legacy / 154 provisional / 2 verified). |
| 2026-08-28 | `36ad94c` | Spain N coast grow (MODE B) | **+13 spots**, all WannaSurf deg/min GPS, all audit IN_WATER/SHORE_OK ≤40 m → `provisional` (4 controls wet, incl. Pipeline-reef known-good). **Basque:** Bakio (beach/both), Sopelana (beach/both), La Salvaje / Barinatxe (beach/both), Orrua / Roka Puta (reef/right), Zurriola / Playa de Gros (beach/both). **Cantabria:** Somo (beach/both), Liencres (beach/both, "best wave in Santander area"), Los Locos / Suances (beach/both), El Brusco (beach/both). **Asturias:** Rodiles (rivermouth/left, "best wave of Asturias"), Salinas / San Juan (beach/both). **Galicia:** Razo / Baldaio (beach/both), Doniños / Ferrol (beach/both). Spain (mainland) 3 → 16. No `legacy` cleared — `MAX_LEGACY` stays 109. Dataset 265 → 278 (109 legacy / 167 provisional / 2 verified). Note: existing legacy **Mundaka** audits CLOSE 62 m — worth a MODE A tighten next Spain pass. |
| 2026-08-28 | `437111c` | Mundaka tighten (MODE A) | Single-break fix. **Mundaka** 43.4078,−2.6993 (legacy, `type`/`direction` null, audit CLOSE 62 m — pin was on the village side of the harbour wall) → **43.4075,−2.6941** (WannaSurf deg/min 43°24.447′N 2°41.648′W, ~420 m ESE onto the estuary sandbar at the river mouth — the actual takeoff). Audit IN_WATER; Pipeline-reef control wet, Guernika-inland control INLAND 147 m. `type` `rivermouth`, `direction` `left` (WannaSurf + Wikipedia + surf-forecast agree). Not promoted to `verified` — surf-forecast only gives 2-decimal 43.42/−2.70 (~1.3 km, outside the 150 m band). sources `["wannasurf","osm-water-audit"]`. **1 `legacy` cleared → `MAX_LEGACY` 109 → 108.** Dataset stays 278 (108 legacy / 168 provisional / 2 verified). |
| 2026-08-29 | `6495760` | Australia E-coast grow (MODE B) | **+9 spots**, all WannaSurf deg/min GPS (Merewether from Wikipedia — dropped, see below), all audit IN_WATER or SHORE_OK ≤6 m → `provisional` (3 controls this run: Pipeline-reef IN_WATER, Tasman-Sea IN_WATER, Brookvale-inland INLAND 508 m). **Gold Coast QLD:** Currumbin Alley / The Alley (point/right), Rainbow Bay (beach/right). **Northern NSW:** Angourie (point/right), Broken Head (point/right, S of Byron), Cabarita Beach / Norries Head (point/right), Crescent Head (point/right — WannaSurf tags it beach but it's the classic Mid-North-Coast right point). **Sydney Northern Beaches:** Dee Why / Dee Why Point (point/right), Freshwater / Freshie (beach/both), Curl Curl (beach/left). Australia total 17 → 26 (QLD 5→7, NSW Northern-Rivers/Mid-North +4, Sydney +3). No `legacy` cleared — `MAX_LEGACY` stays 108. Dataset 278 → 287 (108 legacy / 177 provisional / 2 verified). **Deferred:** Merewether Beach (Newcastle) — audit came back INLAND 175–230 m across 3 nudges (mid/north/south), generalised OSM water polygon at Newcastle (same failure mode as Le Penon / Praia Grande); needs a manual satellite placement. |
| 2026-08-29 | `5114615` | Gold Coast / Tweed / Byron verify (MODE A) | 8 breaks cross-checked vs WannaSurf deg/min + surf-forecast.com + Wikipedia (controls: Pipeline-reef IN_WATER, Coral-Sea IN_WATER, Nerang-inland INLAND 215 m). **Moves (all were ~0.6–2.7 km off):** Snapper Rocks −28.1575,153.5538 → **−28.162,153.5502** (Wikipedia 28°09′45″S 153°33′00″E + surf-forecast agree; old pin sat ~600 m N off the actual rocks) + dropped bogus "Kirra Point" alias; Duranbah −28.1403,153.5428 → **−28.1632,153.5516** (old pin was ~2.7 km NNW up the Tweed River, not the ocean beach — surf-forecast 28.17S/153.55E + geography); Burleigh Heads −28.0972,153.459 → **−28.0884,153.4539** (WannaSurf deg/min = the point; old pin ~1 km S on Burleigh Beach) + off `ai-placement`; The Pass −28.6431,153.615 → **−28.6328,153.6266** (WannaSurf deg/min; old ~1.6 km SW toward town; SHORE_OK 28 m); Lennox Head −28.7917,153.5875 → **−28.8023,153.6005** (WannaSurf deg/min = Lennox Point; old ~1.7 km NW at Seven Mile Beach). **Kept coord, filled type/direction:** Kirra −28.1666,153.5313 (surf-forecast + Wikipedia Kirra-centre corroborate within ~150 m; WannaSurf's −28.1616,153.5463 was the outlier — CLOSE 44 m = groyne generalisation). All `type` `point` `direction` `right` except Duranbah (`beach`/`both`). **5 `legacy` cleared (Snapper Rocks, Kirra, Duranbah, The Pass, Lennox Head) → `MAX_LEGACY` 108 → 103.** Not promoted to `verified` — WannaSurf single-source or 2-decimal corroboration only. **Left `legacy`:** Coolangatta (old coord audits IN_WATER, only sloppy single-source WannaSurf disputes it), Wategos (CLOSE 48 m, no gazetteer coord found). Dataset stays 287 (103 legacy / 182 provisional / 2 verified). |
| 2026-08-29 | `087e23e` | South Africa grow (MODE B) | **+15 spots**, all WannaSurf deg/min GPS, all audit IN_WATER or SHORE_OK ≤27 m → `provisional` (controls: Pipeline-reef IN_WATER, Oudtshoorn-inland CLOSE 51 m — ocean control wet so tiles trustworthy). **Cape Town Peninsula:** Kalk Bay Reef (reef/left, False Bay), Long Beach / Kommetjie (beach/both), Outer Kom (reef/left), Llandudno (beach/both), Dunes / Noordhoek (beach/both), Scarborough (point/left), Big Bay / Bloubergstrand (beach/both). **Jeffreys Bay:** Kitchen Windows (reef/both), Magna Tubes (reef/right). **Eastern Cape:** Seal Point (point/right, Cape St Francis), Bruce's Beauties (point/right, Cape St Francis), Nahoon Reef (point/right, East London). **Garden Route:** Outer Pool (point/right, Mossel Bay). **Wild Coast:** Mdumbi (point/right), Coffee Bay (point/right). South Africa 8 → 23. No `legacy` cleared — `MAX_LEGACY` stays 103. Dataset 287 → 302 (103 legacy / 197 provisional / 2 verified). |
| 2026-08-30 | `519a1da` | South Africa legacy verify (MODE A) | 7 `legacy` breaks cross-checked vs WannaSurf deg/min + Wikipedia + OSM `sport=surfing` nodes (J-Bay is densely mapped in OSM — incl. a `wikidata` Supertubes node). Controls: Pipeline-reef IN_WATER, Humansdorp-inland INLAND 531 m. **Moves (all coarse/placeholder pins ~1–4 km off the real break):** Supertubes −34.0481,24.9313 → **−34.0332,24.9352** (OSM wikidata node + WannaSurf agree the old pin was ~1.7 km S at Main Beach, not up the point) — point/right, `provisional`; Boneyards −34.0439,24.9394 → **−34.0351,24.9343** (OSM node −34.03507,24.9343 + WannaSurf −34.03453,24.93437 agree within ~60 m) — point/right, **promoted `verified`** (2 independent gazetteers <150 m + audit IN_WATER); Cave Rock −29.97,31.03 → **−29.934,31.0141** (WannaSurf; old 2-decimal placeholder ~4 km S of the Bluff) — reef/right, `provisional`; New Pier −29.86,31.049 → **−29.8597,31.0419** (WannaSurf; old lon was a rounding artefact ~700 m offshore) — beach/both, `provisional`; Victoria Bay −34.0056,22.5931 → **−34.0078,22.55** (WannaSurf + Wikipedia both put it at 22.55; old lon was ~3.6 km E toward Wilderness) — point/right, `provisional`. **Kept coord, filled type/direction + promoted:** Muizenberg −34.1083,18.47 (matches Surfers Corner within ~15 m) — beach/both, `provisional`. **Left `legacy`:** Elands Bay — Wikipedia's coord matches the existing pin (town centroid) and WannaSurf's alternative points inland-ish/SE in a suspicious direction; no confident better coord, needs a satellite eyeball. **6 `legacy` cleared → `MAX_LEGACY` 103 → 97.** Dataset stays 302 (97 legacy / 202 provisional / 3 verified). Also normalised one stray 8-space indent on the Mundaka row. |
| 2026-08-30 | `b685333` | Sri Lanka grow (MODE B) | **+12 spots**, all water-audited IN_WATER or SHORE_OK ≤26 m → `provisional` (controls: Pipeline-reef IN_WATER, Ahangama-inland INLAND 1342 m — tiles trustworthy). Coords from OSM named nodes (Nominatim + Overpass: `Peanut Farm Beach`, `Madiha Surf Point`, `Mirissa Beach`, `Hikkaduwa Beach`, `Unawatuna` + `Unuwatuna Coral Reef` way, `Dewata Surf Spot`, `The Cove Surf Spot` reef) where present, else surf-forecast 2-decimal + surf-school-cluster + editorial refinement. **South coast:** Hikkaduwa (reef/both), Weligama Bay (beach/both), Lazy Left / Midigama (point/left), Rams Right / Midigama (reef/right), Coconuts / Midigama (point/both), Kabalana / The Rock, Ahangama (reef/both), Mirissa (reef/right), Unawatuna (reef/right), Dewata / Galle (beach/both), Madiha / Matara (reef/both), Hiriketiya / Dickwella (beach/both). **East coast:** Peanut Farm / Arugam Bay (point/right). Sri Lanka 1 → 13. No `legacy` cleared — `MAX_LEGACY` stays 97. Dataset 302 → 314 (97 legacy / 214 provisional / 3 verified). **Not added (fuzzy sourcing, follow-up):** Whiskey Point, Elephant Rock, Crocodile Rock, Okanda, Pottuvil Point (the last collides with an alias on the legacy `Arugam Bay` row — needs a MODE A cleanup). |
| 2026-08-30 | `db009a9` | Australia legacy cluster verify (MODE A) | 9 breaks cross-checked vs WannaSurf deg/min + Wikipedia + OSM beach ways (controls: Pipeline-reef IN_WATER, W-Sydney-inland INLAND 281 m). **Moves — 8 `legacy` cleared:** Bells Beach −38.3677,144.2829 (CLOSE 103 m) → **−38.3718,144.2811** (WannaSurf 38°22.309′S 144°16.863′E, IN_WATER; Wikipedia's 2-dp 38.367/144.283 ≈ old but village-level) reef/right; Jan Juc −38.399,144.3121 → **−38.3465,144.3102** (WannaSurf 38°20.79′S 144°18.614′E; old was ~5.4 km S past Bells) beach/both; North Narrabeen −33.7094,151.2961 → **−33.7039,151.3094** (WannaSurf "North Narrabeen Point" 33°42.231′S 151°18.565′E; old ~1.3 km W over the lagoon) point/left; Manly Beach −33.7969,151.2878 → **−33.7977,151.29** (OSM beach-way centroid; old ~200 m W in the Corso) beach/both; Maroubra −33.95,151.26 → **−33.9495,151.2574** (WannaSurf 33°56.971′S 151°15.446′E; old a 2-dp placeholder) beach/both; Cronulla −34.0566,151.1542 → **−34.0524,151.1583** (WannaSurf 34°3.142′S 151°9.498′E; old ~600 m W over the peninsula — this is the beach break, not Cronulla Point/Shark Island) beach/both; Coolangatta −28.1697,153.5568 → **−28.1656,153.5399** (WannaSurf 28°9.936′S 153°32.392′E + OSM centroid agree ~180 m; old was ~1.7 km ESE out past Point Danger, not Coolangatta at all) beach/right; Wategos −28.6406,153.6364 → **−28.6355,153.6342** (OSM Wategos Beach way centroid; old ~600 m S on the Cape Byron headland) beach/right. **Metadata only (coord kept):** Bondi Beach −33.8918,151.2775 (IN_WATER) — type/direction filled beach/both, sources `ai-placement` → `osm`. None promoted to `verified` (WannaSurf single precise source / OSM-only). **8 `legacy` cleared → `MAX_LEGACY` 97 → 89.** Dataset stays 314 (89 legacy / 222 provisional / 3 verified). |
| 2026-08-30 | `daf3244` | Canary Islands grow (MODE B) | **+15 spots**, all WannaSurf deg/min GPS, all audit IN_WATER or SHORE_OK ≤9 m → `provisional` (controls: Pipeline-reef IN_WATER, Fuerteventura-interior INLAND 157 m — tiles trustworthy). Canary Islands 3 → 18. **Lanzarote:** La Santa (reef/left), Morro Negro / La Santa Right (point/right), San Juan (reef/both). **Fuerteventura:** Los Lobos (point/right, uninhabited island off Corralejo), The Bubble / La Burbuja (reef/both), Punta Blanca (reef/both), Majanicho (reef/right), El Muelle / Corralejo Harbour (point/left), Spew Pits (reef/both, "World Class" per WannaSurf), Cotillo Beach / Piedra Playa (beach/both). **Gran Canaria:** El Frontón / Gáldar (reef/both — nudged ~7 m seaward off the WannaSurf pin, which audited CLOSE 41 m), La Cícer / Las Canteras (beach/both). **Tenerife:** El Socorro / Los Realejos (reef/both), Martiánez / Puerto de la Cruz (point/both), La Izquierda / Spanish Left (reef/left). All `provisional`, sources `["wannasurf","osm-water-audit"]`, type+direction filled. No `legacy` cleared — `MAX_LEGACY` stays 89. Dataset 314 → 329 (89 legacy / 237 provisional / 3 verified). The 3 pre-existing Canary rows (El Quemao, Famara, El Confital) stay `legacy` — MODE A tighten targets for a future Lanzarote/Gran Canaria verify pass. |
| 2026-08-30 | `_(pending)_` | Portugal legacy cluster verify (MODE A) | 5 famous `legacy` breaks cross-checked vs WannaSurf deg/min + Wikipedia + surf-forecast (controls: Pipeline-reef IN_WATER, Bombarral-inland INLAND 352 m — tiles trustworthy). **Moves (3):** Coxos 39.005,−9.412 (INLAND 149 m, ~1.38 km E of the break) → **39.0006,−9.4269** (WannaSurf 39°0.035′N 9°25.615′W, IN_WATER) reef/right; Praia do Norte / Nazaré 39.6015,−9.071 (INLAND 136 m, ~1.5 km SE at Nazaré town) → **39.6119,−9.0856** (Wikipedia 39.61194,−9.08556 = the Praia do Norte big-wave peak off Forte de São Miguel, SHORE_OK 37 m) beach/both; Supertubos 39.3458,−9.3883 (~2 km W on the wrong/ocean side of the Peniche isthmus) → **39.3448,−9.3645** (WannaSurf 39°20.689′N 9°21.871′W + surf-forecast 39.34/−9.36, IN_WATER) beach/both. **Coord kept (within noise), metadata only:** Guincho 38.7276,−9.4761 (SHORE_OK 7 m; WannaSurf 38°43.807′N 9°28.522′W is ~287 m N on the same beach) beach/both; Ribeira d'Ilhas 38.9878,−9.4193 (SHORE_OK 28 m; WannaSurf 38°59.293′N 9°25.264′W ~154 m away) point/right. None promoted to `verified` — WannaSurf single precise source (Nazaré: Wikipedia only; the WannaSurf "Praia do Norte" page is the *Ericeira* spot, not Nazaré). All 5 → `provisional` with real sources + date. **5 `legacy` cleared → `MAX_LEGACY` 89 → 84.** Dataset stays 329 (84 legacy / 242 provisional / 3 verified). Sagres left `legacy` (per prior note — no clean deg/min, aliased "Tonel" vs the Mareta-ish pin, prior nudges made it worse). |

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

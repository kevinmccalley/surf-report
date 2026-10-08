import type { GeoResult } from './types'
import rawBreaks from '../data/surf-breaks.json'

/** Break morphology. `null` until a break has been classified. */
export type BreakType = 'reef' | 'point' | 'beach' | 'rivermouth' | 'slab'
/** Dominant wave direction. `null` until classified. */
export type BreakDirection = 'left' | 'right' | 'both'
/**
 * How much the coordinate is trusted:
 *  - `legacy`     — pre-dataset value, never independently checked
 *  - `provisional` — placed/moved and confirmed to sit on water, but not yet
 *                    reconciled against 2+ external gazetteers
 *  - `verified`    — agrees with multiple independent sources
 * See docs/surf-breaks-dataset.md.
 */
export type CoordConfidence = 'legacy' | 'provisional' | 'verified'

export interface SurfSpot {
  name: string
  aliases?: string[]
  country: string
  lat: number
  lon: number
  type?: BreakType | null
  direction?: BreakDirection | null
  confidence?: CoordConfidence
  /** Gazetteers / methods the coordinate was cross-checked against. */
  sources?: string[]
  /** ISO date (YYYY-MM-DD) the coordinate was last verified, or `null`. */
  verifiedOn?: string | null
}

// The curated break catalog. Data lives in app/data/surf-breaks.json so it can
// be regenerated, audited, and grown independently of code — see
// docs/surf-breaks-dataset.md. Editing rules + the coordinate-verification
// pipeline are in that doc; `npm run test:run` guards the file's integrity.
const SURF_SPOTS: SurfSpot[] = rawBreaks as unknown as SurfSpot[]

export function searchSurfSpots(query: string): GeoResult[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  // Normalise separators (em-dash, en-dash, commas) to spaces then split into tokens
  const tokens = q
    .replace(/[—–,]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)

  const matches = SURF_SPOTS.filter(s => {
    const haystack = [s.name, ...(s.aliases ?? []), s.country].join(' ').toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })

  // Prefer name-starts-with the first token
  const firstToken = tokens[0] ?? q
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(firstToken) ? 0 : 1
    const bStarts = b.name.toLowerCase().startsWith(firstToken) ? 0 : 1
    return aStarts - bStarts
  })

  return matches.slice(0, 6).map(s => ({
    name: s.name,
    country: s.country,
    lat: s.lat,
    lon: s.lon,
    displayName: `${s.name}, ${s.country}`,
  }))
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// A handful of names (e.g. "Waikiki", "Makaha", "Restaurants") repeat across
// unrelated countries. plain slugify(name) collides for those, and every
// caller that built a /spots/ or /climatology/ href straight from
// slugify(spot.name) was silently routing to whichever spot happened to sit
// first in the array — the other spot's page was unreachable (or, worse,
// showed the wrong spot's live conditions under its own name/title).
//
// getSpotSlug() is the one canonical slug per spot: the first spot to claim a
// base slug (array order — earlier-added, longest-standing spots keep their
// existing, already-indexed URL unchanged) keeps the plain slug; every later
// collision gets a locality suffix (from the last comma-separated segment of
// `country`), with a numeric fallback in the vanishingly rare case that still
// collides. Computed once at module load; every link-building call site
// should use this instead of calling slugify(spot.name) directly.
function localitySlug(country: string): string {
  const parts = country.split(',').map(s => s.trim()).filter(Boolean)
  return slugify(parts[parts.length - 1] ?? country)
}

function buildSlugMaps(): { slugToSpot: Map<string, SurfSpot>; spotToSlug: Map<SurfSpot, string> } {
  const slugToSpot = new Map<string, SurfSpot>()
  const spotToSlug = new Map<SurfSpot, string>()
  const seenCount = new Map<string, number>()

  for (const spot of SURF_SPOTS) {
    const base = slugify(spot.name)
    const seenBefore = seenCount.get(base) ?? 0
    seenCount.set(base, seenBefore + 1)

    let candidate = base
    if (seenBefore > 0) {
      candidate = `${base}-${localitySlug(spot.country)}`
      let n = 2
      while (slugToSpot.has(candidate)) {
        candidate = `${base}-${localitySlug(spot.country)}-${n}`
        n++
      }
    }
    slugToSpot.set(candidate, spot)
    spotToSlug.set(spot, candidate)
  }
  return { slugToSpot, spotToSlug }
}

const { slugToSpot: SLUG_TO_SPOT, spotToSlug: SPOT_TO_SLUG } = buildSlugMaps()

/** The canonical, guaranteed-unique slug for a spot. Use this to build any
 *  /spots/ or /climatology/ link — never slugify(spot.name) directly. */
export function getSpotSlug(spot: SurfSpot): string {
  return SPOT_TO_SLUG.get(spot) ?? slugify(spot.name)
}

export function findSpotBySlug(slug: string): SurfSpot | undefined {
  return SLUG_TO_SPOT.get(slug)
}

// A spot's `name` can change during the groundtruth-verification pass (e.g.
// "Pichilemu" -> "La Puntilla", old name kept only as an alias — see
// docs/surf-breaks-dataset.md). getSpotSlug() always reflects the *current*
// name, so a rename silently orphans any URL Google already indexed under
// the old slug (a real 404 with no redirect). This map lets /spots/ and
// /climatology/ routes 301 those old slugs to the new canonical one instead.
function buildAliasSlugMap(): Map<string, string> {
  const aliasToCanonical = new Map<string, string>()
  for (const spot of SURF_SPOTS) {
    const canonical = getSpotSlug(spot)
    for (const alias of spot.aliases ?? []) {
      const aliasSlug = slugify(alias)
      if (!aliasSlug || aliasSlug === canonical) continue
      // Never let a former name shadow another spot's real, current URL.
      if (SLUG_TO_SPOT.has(aliasSlug)) continue
      if (!aliasToCanonical.has(aliasSlug)) aliasToCanonical.set(aliasSlug, canonical)
    }
  }
  return aliasToCanonical
}

const ALIAS_SLUG_TO_CANONICAL = buildAliasSlugMap()

/** If `slug` is a former spot name (kept as an alias after a rename) rather
 *  than any spot's current URL, returns the canonical slug to redirect to.
 *  Returns undefined for a genuinely unknown slug. */
export function findCanonicalSlugForAlias(slug: string): string | undefined {
  return ALIAS_SLUG_TO_CANONICAL.get(slug)
}

export function getAllSpots(): SurfSpot[] {
  return SURF_SPOTS
}

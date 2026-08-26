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

export function findSpotBySlug(slug: string): SurfSpot | undefined {
  return SURF_SPOTS.find(s => slugify(s.name) === slug)
}

export function getAllSpots(): SurfSpot[] {
  return SURF_SPOTS
}

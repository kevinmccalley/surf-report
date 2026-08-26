// Shared shape + helpers for the premium "live conditions on the map" layer
// (surf-regions Phase 8). Pure and dependency-free so the cron (server), the
// read route (server), and the map components (client) can all import it.
//
// See docs/surf-regions-phase8-scope.md.

export interface SpotConditions {
  /** Swell height, metres. */
  waveHeight: number
  /** Wave period, seconds. */
  wavePeriod: number
  /** Swell direction, degrees. */
  swellDir: number
  /** Compass label for `swellDir`, e.g. "WNW". */
  swellDirLabel: string
  /** Wind speed, km/h. */
  windSpeed: number
  /** 0–100 surf-rating score. */
  score: number
  /** Rating label, e.g. "GOOD", "EPIC". Keys `RATING_COLORS`. */
  ratingLabel: string
}

/** The Redis snapshot the region-conditions cron writes and the read route serves. */
export interface RegionConditionsSnapshot {
  /** Keyed by break slug (`slugify(spot.name)`). */
  spots: Record<string, SpotConditions>
  updatedAt: string
  checkedCount: number
}

/** Rating label → pin colour. Mirrors the palette in `app/lib/surf-rating.ts`. */
export const RATING_COLORS: Record<string, string> = {
  FLAT: '#6b7280',
  POOR: '#ef4444',
  'POOR TO FAIR': '#f97316',
  FAIR: '#eab308',
  'FAIR TO GOOD': '#84cc16',
  GOOD: '#22c55e',
  'VERY GOOD': '#0ea5e9',
  EPIC: '#a855f7',
}

export function ratingColor(label: string | undefined): string | null {
  return label ? RATING_COLORS[label] ?? null : null
}

import { getSurfRegionBySlug } from './surf-regions'

/**
 * How many regions an `individual`-tier subscriber may unlock at once.
 * Swappable at any time — removing one frees a slot (spec §7).
 */
export const MAX_PICKED_REGIONS = 5

/**
 * Clean a user-supplied "My Regions" list before it's trusted or stored:
 * strings only, trimmed + lowercased, de-duplicated, real region slugs only,
 * flagship regions dropped (they're already open for everyone, so a pick would
 * waste a slot), and capped at {@link MAX_PICKED_REGIONS} first-wins.
 *
 * Pure — shared by the write API and covered by unit tests.
 */
export function sanitizePicks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const slug = value.trim().toLowerCase()
    if (!slug || out.includes(slug)) continue
    const region = getSurfRegionBySlug(slug)
    if (!region || region.flagship) continue
    out.push(slug)
    if (out.length === MAX_PICKED_REGIONS) break
  }
  return out
}

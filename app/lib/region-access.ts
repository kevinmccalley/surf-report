import type { SubscriptionTier } from './subscription'

// Who can see the payoff (fit-to-region map + every spot's forecast) for a
// given region. Names + spot count stay public for everyone — see spec §7.
//
// Pure and dependency-light so it runs the same on the server page and in the
// client detail component, and so it's unit-testable.

export type RegionLockState = 'open' | 'locked'

interface RegionAccessInput {
  slug: string
  flagship?: boolean
}

/**
 * - premium  → everything open
 * - flagship → open on every tier (the free sample)
 * - individual → open only for the region slugs they've picked (Phase 6 wires
 *   the picker; until then `pickedSlugs` is empty and individual behaves like free)
 * - free / anon → locked
 */
export function regionLockState(
  tier: SubscriptionTier,
  region: RegionAccessInput,
  pickedSlugs: readonly string[] = [],
): RegionLockState {
  if (tier === 'premium') return 'open'
  if (region.flagship) return 'open'
  if (tier === 'individual' && pickedSlugs.includes(region.slug)) return 'open'
  return 'locked'
}

/**
 * The country-aggregate view ("every region in Indonesia") is open only when
 * the viewer can see every one of its member regions — otherwise it'd leak the
 * locked ones' maps.
 */
export function countryLockState(
  tier: SubscriptionTier,
  regions: readonly RegionAccessInput[],
  pickedSlugs: readonly string[] = [],
): RegionLockState {
  if (regions.length === 0) return 'locked'
  return regions.every(r => regionLockState(tier, r, pickedSlugs) === 'open') ? 'open' : 'locked'
}

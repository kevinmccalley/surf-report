import { describe, it, expect } from 'vitest'
import { ratingColor, RATING_COLORS } from '../spot-conditions'
import { computeSurfRating } from '../surf-rating'

describe('ratingColor', () => {
  it('maps every rating label computeSurfRating can produce', () => {
    // Sweep a wide range of inputs and confirm no label falls through.
    for (let h = 0; h <= 6; h += 0.5) {
      for (let p = 0; p <= 20; p += 4) {
        for (const wind of [0, 15, 40]) {
          const label = computeSurfRating(h, p, h, p, wind).label
          expect(ratingColor(label), `no colour for "${label}"`).toMatch(/^#[0-9a-f]{6}$/i)
        }
      }
    }
  })

  it('returns null for an unknown or missing label', () => {
    expect(ratingColor(undefined)).toBeNull()
    expect(ratingColor('NONSENSE')).toBeNull()
    expect(ratingColor('')).toBeNull()
  })

  it('known labels resolve to their palette hex', () => {
    expect(ratingColor('EPIC')).toBe(RATING_COLORS.EPIC)
    expect(ratingColor('GOOD')).toBe('#22c55e')
    expect(ratingColor('FLAT')).toBe('#6b7280')
  })
})

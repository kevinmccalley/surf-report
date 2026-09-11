import { describe, it, expect } from 'vitest'
import { getRegionSecondarySpots } from '../region-nearby'
import { getRegionSpots, getSurfRegionBySlug, getSurfRegions } from '../surf-regions'
import { slugify } from '../surf-spots'

describe('getRegionSecondarySpots', () => {
  it('finds Surfline-directory spots near Ericeira & Peniche beyond the 4 curated breaks', () => {
    const region = getSurfRegionBySlug('portugal-ericeira-peniche')!
    const secondary = getRegionSecondarySpots(region)
    expect(secondary.length).toBeGreaterThan(0)
    // Real-world case this feature exists for: Kevin searched "Lourinhã" and
    // saw spots (e.g. Praia da Areia Branca) that never showed on this region.
    expect(secondary.some(s => /Areia Branca/i.test(s.name))).toBe(true)
  })

  it('never repeats a spot already in the region\'s curated list', () => {
    const region = getSurfRegionBySlug('portugal-ericeira-peniche')!
    const curatedSlugs = new Set(getRegionSpots(region).map(s => slugify(s.name)))
    const secondary = getRegionSecondarySpots(region)
    for (const s of secondary) {
      expect(curatedSlugs.has(s.slug)).toBe(false)
    }
  })

  it('every result is within the reported catchment and results are sorted nearest-first', () => {
    const region = getSurfRegionBySlug('portugal-ericeira-peniche')!
    const secondary = getRegionSecondarySpots(region)
    for (let i = 1; i < secondary.length; i++) {
      expect(secondary[i].distanceKm).toBeGreaterThanOrEqual(secondary[i - 1].distanceKm)
    }
  })

  it('caps out at a bounded list size for every region (no runaway pin count)', () => {
    for (const region of getSurfRegions()) {
      const secondary = getRegionSecondarySpots(region)
      expect(secondary.length).toBeLessThanOrEqual(30)
    }
  })

  it('every secondary spot has a URL-safe non-empty slug', () => {
    const region = getSurfRegionBySlug('portugal-ericeira-peniche')!
    for (const s of getRegionSecondarySpots(region)) {
      expect(s.slug.length).toBeGreaterThan(0)
      expect(s.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

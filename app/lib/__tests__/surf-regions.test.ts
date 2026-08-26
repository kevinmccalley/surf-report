import { describe, it, expect } from 'vitest'
import {
  getSurfRegions,
  getSurfRegionBySlug,
  getSurfRegionsByContinent,
  getSurfRegionsByCountry,
  getRegionSpots,
  getCountryAggregate,
} from '../surf-regions'
import { CONTINENTS } from '../continents'
import { getAllSpots, slugify } from '../surf-spots'

const REGIONS = getSurfRegions()
const KNOWN_SLUGS = new Set(getAllSpots().map(s => slugify(s.name)))

// ── Data integrity ───────────────────────────────────────────────────────────

describe('surf-regions data integrity', () => {
  it('has a healthy number of regions', () => {
    expect(REGIONS.length).toBeGreaterThanOrEqual(45)
  })

  it('every region slug is unique', () => {
    const slugs = REGIONS.map(r => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every region slug is url-safe kebab-case', () => {
    for (const r of REGIONS) expect(r.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('every region has a non-empty proper-noun name', () => {
    for (const r of REGIONS) expect(r.name.trim().length).toBeGreaterThan(0)
  })

  it('every continent is a valid Continent bucket', () => {
    for (const r of REGIONS) expect(CONTINENTS).toContain(r.continent)
  })

  it('every country is a 2-letter uppercase ISO code', () => {
    for (const r of REGIONS) expect(r.country).toMatch(/^[A-Z]{2}$/)
  })

  it('every center is a plausible lat/lon', () => {
    for (const r of REGIONS) {
      expect(r.center.lat).toBeGreaterThanOrEqual(-90)
      expect(r.center.lat).toBeLessThanOrEqual(90)
      expect(r.center.lon).toBeGreaterThanOrEqual(-180)
      expect(r.center.lon).toBeLessThanOrEqual(180)
    }
  })

  it('every region has at least one spot', () => {
    for (const r of REGIONS) expect(r.spotSlugs.length).toBeGreaterThan(0)
  })

  it('every spotSlug resolves to a real spot in the catalog', () => {
    const orphans: string[] = []
    for (const r of REGIONS) {
      for (const slug of r.spotSlugs) {
        if (!KNOWN_SLUGS.has(slug)) orphans.push(`${r.slug} -> ${slug}`)
      }
    }
    expect(orphans).toEqual([])
  })

  it('no spot slug is claimed by more than one region', () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const r of REGIONS) {
      for (const slug of r.spotSlugs) {
        if (seen.has(slug)) dupes.push(`${slug}: ${seen.get(slug)} & ${r.slug}`)
        else seen.set(slug, r.slug)
      }
    }
    expect(dupes).toEqual([])
  })

  it('flagship regions are exactly Central California and Ericeira/Peniche', () => {
    const flagships = REGIONS.filter(r => r.flagship).map(r => r.slug).sort()
    expect(flagships).toEqual(['central-california', 'portugal-ericeira-peniche'])
  })
})

// ── getSurfRegionBySlug ──────────────────────────────────────────────────────

describe('getSurfRegionBySlug', () => {
  it('finds North Shore, Oahu', () => {
    const r = getSurfRegionBySlug('north-shore-oahu')
    expect(r?.name).toBe('North Shore, Oahu')
    expect(r?.spotSlugs).toContain('pipeline')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getSurfRegionBySlug('atlantis')).toBeUndefined()
  })
})

// ── getSurfRegionsByContinent ────────────────────────────────────────────────

describe('getSurfRegionsByContinent', () => {
  it('returns only Japan regions for Japan', () => {
    const japan = getSurfRegionsByContinent('Japan')
    expect(japan.length).toBeGreaterThan(0)
    expect(japan.every(r => r.continent === 'Japan')).toBe(true)
  })

  it('covers most continent buckets', () => {
    const covered = new Set(REGIONS.map(r => r.continent))
    // Every bucket except possibly none — all 9 should have at least one region.
    for (const c of CONTINENTS) expect(covered.has(c)).toBe(true)
  })
})

// ── getSurfRegionsByCountry ──────────────────────────────────────────────────

describe('getSurfRegionsByCountry', () => {
  it('is case-insensitive', () => {
    expect(getSurfRegionsByCountry('id')).toEqual(getSurfRegionsByCountry('ID'))
  })

  it('returns every Indonesian region', () => {
    const slugs = getSurfRegionsByCountry('ID').map(r => r.slug).sort()
    expect(slugs).toEqual(
      ['bali', 'java-g-land', 'lombok', 'mentawai-islands', 'sumatra-nias'].sort(),
    )
  })

  it('returns [] for a country with no regions', () => {
    expect(getSurfRegionsByCountry('ZZ')).toEqual([])
  })
})

// ── getRegionSpots ───────────────────────────────────────────────────────────

describe('getRegionSpots', () => {
  it('resolves every slug for a region (no drops)', () => {
    for (const r of REGIONS) {
      expect(getRegionSpots(r).length).toBe(r.spotSlugs.length)
    }
  })

  it('returns SurfSpot records with coordinates', () => {
    const spots = getRegionSpots(getSurfRegionBySlug('bali')!)
    expect(spots.length).toBeGreaterThan(0)
    for (const s of spots) {
      expect(typeof s.lat).toBe('number')
      expect(typeof s.lon).toBe('number')
    }
  })
})

// ── getCountryAggregate ──────────────────────────────────────────────────────

describe('getCountryAggregate', () => {
  it('unions spot slugs across every Indonesian region, deduped', () => {
    const agg = getCountryAggregate('ID')!
    expect(agg.country).toBe('ID')
    expect(agg.regionSlugs).toContain('bali')
    expect(agg.regionSlugs).toContain('mentawai-islands')
    expect(new Set(agg.spotSlugs).size).toBe(agg.spotSlugs.length)
    expect(agg.spotSlugs).toContain('uluwatu')
    expect(agg.spotSlugs).toContain('g-land')
  })

  it('produces well-ordered bounds [[S,W],[N,E]]', () => {
    const agg = getCountryAggregate('AU')!
    expect(agg.bounds).not.toBeNull()
    const [[s, w], [n, e]] = agg.bounds!
    expect(s).toBeLessThanOrEqual(n)
    expect(w).toBeLessThanOrEqual(e)
    expect(agg.center.lat).toBeGreaterThanOrEqual(s)
    expect(agg.center.lat).toBeLessThanOrEqual(n)
  })

  it('returns null for a country with no regions', () => {
    expect(getCountryAggregate('ZZ')).toBeNull()
  })
})

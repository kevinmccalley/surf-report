import { describe, it, expect } from 'vitest'
import {
  getSurfRegions,
  getSurfRegionBySlug,
  getSurfRegionsByContinent,
  getSurfRegionsByCountry,
  getRegionSpots,
  getRegionMapPoints,
  getCountryAggregate,
  searchSurfRegions,
} from '../surf-regions'
import { regionFitTarget } from '../region-map'
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

// ── getRegionMapPoints ───────────────────────────────────────────────────────

describe('getRegionMapPoints', () => {
  it('shapes every region spot as a map point with coords', () => {
    for (const r of REGIONS) {
      const pts = getRegionMapPoints(r)
      expect(pts.length).toBe(r.spotSlugs.length)
      for (const p of pts) {
        expect(p.slug.length).toBeGreaterThan(0)
        expect(p.name.length).toBeGreaterThan(0)
        expect(Number.isFinite(p.lat)).toBe(true)
        expect(Number.isFinite(p.lon)).toBe(true)
      }
    }
  })

  it('feeds regionFitTarget to a bounds/point view for every region', () => {
    for (const r of REGIONS) {
      const target = regionFitTarget(getRegionMapPoints(r), r.bounds)
      expect(['bounds', 'point']).toContain(target.kind)
    }
  })

  it('the fitted bbox for a multi-spot region encloses its spots', () => {
    const socal = getSurfRegionBySlug('southern-california')!
    const pts = getRegionMapPoints(socal)
    const target = regionFitTarget(pts, socal.bounds)
    expect(target.kind).toBe('bounds')
    if (target.kind !== 'bounds') return
    const [[s, w], [n, e]] = target.bounds
    for (const p of pts) {
      expect(p.lat).toBeGreaterThanOrEqual(s)
      expect(p.lat).toBeLessThanOrEqual(n)
      expect(p.lon).toBeGreaterThanOrEqual(w)
      expect(p.lon).toBeLessThanOrEqual(e)
    }
  })
})

// ── searchSurfRegions ────────────────────────────────────────────────────────

describe('searchSurfRegions', () => {
  it('ignores queries shorter than 2 chars', () => {
    expect(searchSurfRegions('a')).toEqual([])
    expect(searchSurfRegions('')).toEqual([])
  })

  it('returns [] when nothing matches', () => {
    expect(searchSurfRegions('zzzznope')).toEqual([])
  })

  it('matches a region by name', () => {
    const r = searchSurfRegions('baja')
    const slugs = r.map(x => x.slug)
    expect(slugs).toContain('baja-norte')
    expect(slugs).toContain('baja-sur')
    expect(r.every(x => x.kind === 'region')).toBe(true)
  })

  it('matches a region by search alias', () => {
    const r = searchSurfRegions('j-bay')
    expect(r.some(x => x.slug === 'south-africa-eastern-cape')).toBe(true)
  })

  it('surfaces the country aggregate first for a country-name query', () => {
    const r = searchSurfRegions('portugal')
    expect(r[0].kind).toBe('country')
    expect(r[0].slug).toBe('pt')
    expect(r[0].href).toBe('/regions/country/pt')
    expect(r[0].regionCount).toBeGreaterThanOrEqual(3)
    // Portugal regions follow.
    expect(r.some(x => x.kind === 'region' && x.slug.startsWith('portugal-'))).toBe(true)
  })

  it('does not emit a country aggregate for single-region countries', () => {
    const r = searchSurfRegions('peru')
    expect(r.every(x => x.kind === 'region')).toBe(true)
  })

  it('every result has a well-formed href and honours the limit', () => {
    const r = searchSurfRegions('coast', 4) // matches several "… Coast" aliases
    expect(r.length).toBeLessThanOrEqual(4)
    expect(r.length).toBeGreaterThan(0)
    for (const x of r) {
      expect(x.href).toMatch(x.kind === 'country' ? /^\/regions\/country\/[a-z]{2}$/ : /^\/regions\/[a-z0-9-]+$/)
      expect(x.spotCount).toBeGreaterThan(0)
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

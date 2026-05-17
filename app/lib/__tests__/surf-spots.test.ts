import { describe, it, expect } from 'vitest'
import { slugify, findSpotBySlug, searchSurfSpots, getAllSpots } from '../surf-spots'

// ── slugify ──────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases the name', () => expect(slugify('Pipeline')).toBe('pipeline'))
  it('replaces spaces with hyphens', () => expect(slugify('First Point Malibu')).toBe('first-point-malibu'))
  it('strips apostrophes', () => expect(slugify("Teahupo'o")).toBe('teahupoo'))
  it('collapses multiple non-alphanumeric chars to one hyphen', () => expect(slugify('G-Land')).toBe('g-land'))
  it('trims leading and trailing hyphens', () => expect(slugify('-Spot-')).toBe('spot'))
  it('handles names with accents via passthrough', () => {
    // Non-ASCII letters are collapsed to hyphens
    const result = slugify('Réunion')
    expect(result).toMatch(/^[a-z0-9-]+$/)
  })
  it('handles HT\'s (Hollow Trees)', () => expect(slugify("HT's")).toBe('hts'))
  it('handles La Graviere', () => expect(slugify('La Graviere')).toBe('la-graviere'))
})

// ── findSpotBySlug ────────────────────────────────────────────────────────────

describe('findSpotBySlug', () => {
  it('finds Pipeline by slug', () => {
    const spot = findSpotBySlug('pipeline')
    expect(spot).toBeDefined()
    expect(spot!.name).toBe('Pipeline')
  })

  it('finds Mavericks by slug', () => {
    const spot = findSpotBySlug('mavericks')
    expect(spot).toBeDefined()
    expect(spot!.name).toBe('Mavericks')
  })

  it('finds Cloudbreak by slug', () => {
    const spot = findSpotBySlug('cloudbreak')
    expect(spot).toBeDefined()
    expect(spot!.name).toBe('Cloudbreak')
  })

  it('returns undefined for an unknown slug', () => {
    expect(findSpotBySlug('totally-fake-spot')).toBeUndefined()
  })

  it('is case-sensitive (slug must be lowercase)', () => {
    expect(findSpotBySlug('Pipeline')).toBeUndefined()
  })

  it('found spot has lat, lon, and country', () => {
    const spot = findSpotBySlug('pipeline')!
    expect(typeof spot.lat).toBe('number')
    expect(typeof spot.lon).toBe('number')
    expect(typeof spot.country).toBe('string')
  })
})

// ── getAllSpots ───────────────────────────────────────────────────────────────

describe('getAllSpots', () => {
  it('returns a non-empty array', () => {
    expect(getAllSpots().length).toBeGreaterThan(0)
  })

  it('every spot has required fields', () => {
    for (const spot of getAllSpots()) {
      expect(typeof spot.name).toBe('string')
      expect(typeof spot.lat).toBe('number')
      expect(typeof spot.lon).toBe('number')
      expect(typeof spot.country).toBe('string')
    }
  })

  it('every spot name slugifies to a non-empty string', () => {
    for (const spot of getAllSpots()) {
      expect(slugify(spot.name).length).toBeGreaterThan(0)
    }
  })

  it('slug collisions are fewer than 5 (some spots share a name across countries)', () => {
    const slugs = getAllSpots().map(s => slugify(s.name))
    const unique = new Set(slugs)
    expect(slugs.length - unique.size).toBeLessThan(5)
  })
})

// ── searchSurfSpots ───────────────────────────────────────────────────────────

describe('searchSurfSpots', () => {
  it('returns empty array for query shorter than 2 chars', () => {
    expect(searchSurfSpots('')).toEqual([])
    expect(searchSurfSpots('x')).toEqual([])
  })

  it('finds Pipeline by name', () => {
    const results = searchSurfSpots('pipeline')
    expect(results.some(r => r.name === 'Pipeline')).toBe(true)
  })

  it('finds Mavericks by name', () => {
    const results = searchSurfSpots('mavericks')
    expect(results.some(r => r.name === 'Mavericks')).toBe(true)
  })

  it('finds spots via alias — Banzai → Pipeline', () => {
    const results = searchSurfSpots('banzai')
    expect(results.some(r => r.name === 'Pipeline')).toBe(true)
  })

  it('finds spots via alias — J-Bay → Supertubes', () => {
    const results = searchSurfSpots('j-bay')
    expect(results.some(r => r.name === 'Supertubes')).toBe(true)
  })

  it('returns at most 6 results', () => {
    // A common word like "beach" could match many spots
    const results = searchSurfSpots('beach')
    expect(results.length).toBeLessThanOrEqual(6)
  })

  it('matches by country token', () => {
    const results = searchSurfSpots('hawaii')
    expect(results.length).toBeGreaterThan(0)
  })

  it('supports multi-token queries', () => {
    // "steamer santa" should hit Steamer Lane with country "Santa Cruz"
    const results = searchSurfSpots('steamer santa')
    expect(results.some(r => r.name === 'Steamer Lane')).toBe(true)
  })

  it('result items include name, lat, lon, country, displayName', () => {
    const results = searchSurfSpots('pipeline')
    const first = results[0]
    expect(typeof first.name).toBe('string')
    expect(typeof first.lat).toBe('number')
    expect(typeof first.lon).toBe('number')
    expect(typeof first.country).toBe('string')
    expect(typeof first.displayName).toBe('string')
  })

  it('prefers name-starts-with results over partial matches', () => {
    // "rin" matches "Rincon" and "La Graviere" (doesn't), "Rincon PR" etc.
    const results = searchSurfSpots('rincon')
    expect(results[0].name.toLowerCase()).toMatch(/^rincon/)
  })
})

import { describe, it, expect } from 'vitest'
import breaks from '../../data/surf-breaks.json'
import { slugify } from '../surf-spots'

// Integrity guard for app/data/surf-breaks.json — the curated coordinate
// dataset. Rules + the verification pipeline live in
// docs/surf-breaks-dataset.md. This runs in CI so a malformed edit fails fast.

type Raw = {
  name: string
  aliases?: string[]
  country: string
  lat: number
  lon: number
  type?: string | null
  direction?: string | null
  confidence?: string
  sources?: string[]
  verifiedOn?: string | null
}
const rows = breaks as unknown as Raw[]

const CONFIDENCE = ['legacy', 'provisional', 'verified']
const TYPES = ['reef', 'point', 'beach', 'rivermouth', 'slab']
const DIRECTIONS = ['left', 'right', 'both']

// Ratchet: the number of never-verified `legacy` rows must only ever go DOWN.
// Lower this each time a verification batch lands. See the dataset doc.
const MAX_LEGACY = 103

const R = 6371000
const rad = (d: number) => (d * Math.PI) / 180
function haversine(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

describe('surf-breaks.json — shape', () => {
  it('is a non-empty array that only grows past the seed size', () => {
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThanOrEqual(182)
  })

  it('every row has a non-empty name and country', () => {
    for (const r of rows) {
      expect(typeof r.name, JSON.stringify(r)).toBe('string')
      expect(r.name.trim().length).toBeGreaterThan(0)
      expect(typeof r.country).toBe('string')
      expect(r.country.trim().length).toBeGreaterThan(0)
    }
  })

  it('coordinates are finite and within surfable latitudes', () => {
    for (const r of rows) {
      expect(Number.isFinite(r.lat), r.name).toBe(true)
      expect(Number.isFinite(r.lon), r.name).toBe(true)
      expect(r.lat, r.name).toBeGreaterThan(-60)
      expect(r.lat, r.name).toBeLessThan(72)
      expect(r.lon, r.name).toBeGreaterThanOrEqual(-180)
      expect(r.lon, r.name).toBeLessThanOrEqual(180)
    }
  })

  it('coordinates carry real precision (not rounded to a whole degree)', () => {
    for (const r of rows) {
      const dp = (n: number) => (String(n).split('.')[1] ?? '').length
      expect(Math.max(dp(r.lat), dp(r.lon)), `${r.name} looks rounded`).toBeGreaterThanOrEqual(2)
    }
  })

  it('aliases, when present, is a string[]', () => {
    for (const r of rows) {
      if (r.aliases === undefined) continue
      expect(Array.isArray(r.aliases), r.name).toBe(true)
      for (const a of r.aliases) expect(typeof a).toBe('string')
    }
  })
})

describe('surf-breaks.json — metadata', () => {
  it('confidence is one of the allowed values', () => {
    for (const r of rows) {
      expect(CONFIDENCE, r.name).toContain(r.confidence)
    }
  })

  it('type / direction, when set, use the controlled vocabulary', () => {
    for (const r of rows) {
      if (r.type != null) expect(TYPES, r.name).toContain(r.type)
      if (r.direction != null) expect(DIRECTIONS, r.name).toContain(r.direction)
    }
  })

  it('verifiedOn is null or an ISO YYYY-MM-DD date', () => {
    for (const r of rows) {
      if (r.verifiedOn == null) continue
      expect(r.verifiedOn, r.name).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(r.verifiedOn)), r.name).toBe(false)
    }
  })

  it('legacy rows are unverified; provisional/verified rows cite a source + date', () => {
    for (const r of rows) {
      if (r.confidence === 'legacy') {
        expect(r.verifiedOn ?? null, r.name).toBeNull()
      } else {
        expect((r.sources ?? []).length, `${r.name} missing sources`).toBeGreaterThan(0)
        expect(r.verifiedOn, `${r.name} missing verifiedOn`).toBeTruthy()
      }
    }
  })

  it('the count of never-verified legacy rows only ratchets down', () => {
    const legacy = rows.filter(r => r.confidence === 'legacy').length
    expect(legacy).toBeLessThanOrEqual(MAX_LEGACY)
  })
})

describe('surf-breaks.json — uniqueness', () => {
  it('no duplicate name + country pair', () => {
    const seen = new Set<string>()
    const dups: string[] = []
    for (const r of rows) {
      const key = `${r.name}::${r.country}`
      if (seen.has(key)) dups.push(key)
      seen.add(key)
    }
    expect(dups).toEqual([])
  })

  it('no two distinct breaks share a coordinate within 25 m (likely a paste error)', () => {
    const tooClose: string[] = []
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (Math.abs(rows[i].lat - rows[j].lat) > 0.01) continue
        const d = haversine(rows[i].lat, rows[i].lon, rows[j].lat, rows[j].lon)
        if (d < 25) tooClose.push(`${rows[i].name} ~ ${rows[j].name} (${d.toFixed(0)} m)`)
      }
    }
    expect(tooClose).toEqual([])
  })

  it('every name slugifies to something non-empty and URL-safe', () => {
    for (const r of rows) {
      const s = slugify(r.name)
      expect(s.length, r.name).toBeGreaterThan(0)
      expect(s).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

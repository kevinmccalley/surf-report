import { describe, it, expect } from 'vitest'
import { sanitizePicks, MAX_PICKED_REGIONS } from '../region-picks'

describe('sanitizePicks', () => {
  it('keeps real, non-flagship region slugs', () => {
    expect(sanitizePicks(['baja-sur', 'maui', 'florida'])).toEqual(['baja-sur', 'maui', 'florida'])
  })

  it('returns [] for non-array input', () => {
    expect(sanitizePicks(undefined)).toEqual([])
    expect(sanitizePicks(null)).toEqual([])
    expect(sanitizePicks('baja-sur')).toEqual([])
    expect(sanitizePicks({ 0: 'baja-sur' })).toEqual([])
  })

  it('drops non-string entries', () => {
    expect(sanitizePicks(['baja-sur', 42, null, { slug: 'maui' }, 'florida'])).toEqual([
      'baja-sur',
      'florida',
    ])
  })

  it('trims and lowercases', () => {
    expect(sanitizePicks(['  Baja-Sur  ', 'MAUI'])).toEqual(['baja-sur', 'maui'])
  })

  it('de-duplicates, first-wins', () => {
    expect(sanitizePicks(['maui', 'baja-sur', 'maui'])).toEqual(['maui', 'baja-sur'])
  })

  it('drops slugs that are not a real region', () => {
    expect(sanitizePicks(['baja-sur', 'atlantis', 'not-a-region'])).toEqual(['baja-sur'])
  })

  it('drops flagship regions — they are already open, a pick would waste a slot', () => {
    expect(sanitizePicks(['central-california', 'portugal-ericeira-peniche', 'baja-sur'])).toEqual([
      'baja-sur',
    ])
  })

  it(`caps at ${MAX_PICKED_REGIONS} (first-wins)`, () => {
    const many = ['baja-sur', 'maui', 'florida', 'puerto-rico', 'south-shore-oahu', 'kauai', 'outer-banks']
    const out = sanitizePicks(many)
    expect(out).toHaveLength(MAX_PICKED_REGIONS)
    expect(out).toEqual(many.slice(0, MAX_PICKED_REGIONS))
  })

  it('empty array stays empty', () => {
    expect(sanitizePicks([])).toEqual([])
  })
})

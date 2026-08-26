import { describe, it, expect } from 'vitest'
import { mapStyle, PMTILES_URL, USING_DEMO_PMTILES } from '../map-style'

describe('mapStyle', () => {
  it('builds a valid GL style v8 for both themes', () => {
    for (const isDark of [false, true]) {
      const s = mapStyle(isDark) as Record<string, unknown>
      expect(s.version).toBe(8)
      expect(Array.isArray(s.layers)).toBe(true)
      expect((s.layers as unknown[]).length).toBeGreaterThan(10)
    }
  })

  it('sources the basemap from the pmtiles:// protocol', () => {
    const s = mapStyle(false) as { sources: Record<string, { type: string; url: string }> }
    expect(s.sources.protomaps.type).toBe('vector')
    expect(s.sources.protomaps.url.startsWith('pmtiles://')).toBe(true)
    expect(s.sources.protomaps.url).toContain(PMTILES_URL)
  })

  it('points glyphs + sprite at the asset bundle, differing by theme', () => {
    const light = mapStyle(false) as { glyphs: string; sprite: string }
    const dark = mapStyle(true) as { glyphs: string; sprite: string }
    expect(light.glyphs).toContain('{fontstack}')
    expect(light.glyphs).toContain('{range}')
    expect(light.sprite).toMatch(/\/light$/)
    expect(dark.sprite).toMatch(/\/dark$/)
  })

  it('produces different layer paint between light and dark', () => {
    const light = JSON.stringify((mapStyle(false) as { layers: unknown[] }).layers)
    const dark = JSON.stringify((mapStyle(true) as { layers: unknown[] }).layers)
    expect(light).not.toBe(dark)
  })

  it('falls back to the demo bucket when NEXT_PUBLIC_PMTILES_URL is unset', () => {
    // No env var in the test environment.
    expect(USING_DEMO_PMTILES).toBe(true)
    expect(PMTILES_URL).toMatch(/^https:\/\/.*\.pmtiles$/)
  })
})

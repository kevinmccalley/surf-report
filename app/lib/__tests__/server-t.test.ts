import { describe, it, expect } from 'vitest'
import { serverT } from '../server-t'

// ── known key in all locales ──────────────────────────────────────────────────

describe('serverT — known key', () => {
  it('returns English text for lang=en', () => {
    const result = serverT('en', 'months.jan')
    expect(result).toBe('Jan')
  })

  it('returns Spanish text for lang=es', () => {
    const result = serverT('es', 'months.jan')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns French text for lang=fr', () => {
    const result = serverT('fr', 'months.jan')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns pt-BR text for lang=pt-BR', () => {
    const result = serverT('pt-BR', 'months.jan')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns pt-PT text for lang=pt-PT', () => {
    const result = serverT('pt-PT', 'months.jan')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── fallback behaviour ────────────────────────────────────────────────────────

describe('serverT — unknown locale falls back to English', () => {
  it('returns English value for an unsupported locale', () => {
    const en = serverT('en', 'months.jan')
    const unknown = serverT('de', 'months.jan')
    expect(unknown).toBe(en)
  })

  it('returns English value for empty string locale', () => {
    const en = serverT('en', 'months.jan')
    expect(serverT('', 'months.jan')).toBe(en)
  })
})

describe('serverT — unknown key falls back to the key itself', () => {
  it('returns the key string when key is not in English messages', () => {
    expect(serverT('en', 'nonexistent.key.xyz')).toBe('nonexistent.key.xyz')
  })

  it('returns the key string for unknown locale + unknown key', () => {
    expect(serverT('xx', 'totally.missing')).toBe('totally.missing')
  })
})

// ── multiple keys spot-check ──────────────────────────────────────────────────

describe('serverT — spot-check several keys', () => {
  it('translates search.ariaLabel in English', () => {
    expect(serverT('en', 'search.ariaLabel')).toBe('Search surf location')
  })

  it('all 12 month abbreviations return non-empty strings in English', () => {
    const keys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for (const k of keys) {
      const result = serverT('en', `months.${k}`)
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toBe(`months.${k}`)
    }
  })

  it('returns a string (not undefined or null) for any locale + key combo', () => {
    const locales = ['en', 'es', 'fr', 'pt-BR', 'pt-PT']
    for (const lang of locales) {
      const result = serverT(lang, 'months.jan')
      expect(typeof result).toBe('string')
    }
  })
})

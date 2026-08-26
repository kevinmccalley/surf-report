import { describe, it, expect } from 'vitest'
import { regionLockState, countryLockState } from '../region-access'

const flagship = { slug: 'central-california', flagship: true }
const locked = { slug: 'baja-sur' }
const picked = { slug: 'fiji' }

describe('regionLockState', () => {
  it('opens everything for premium', () => {
    expect(regionLockState('premium', locked)).toBe('open')
    expect(regionLockState('premium', flagship)).toBe('open')
  })

  it('opens flagship regions on every tier', () => {
    expect(regionLockState('free', flagship)).toBe('open')
    expect(regionLockState('individual', flagship)).toBe('open')
  })

  it('locks non-flagship regions for free', () => {
    expect(regionLockState('free', locked)).toBe('locked')
  })

  it('opens an individual pick, locks the rest', () => {
    expect(regionLockState('individual', picked, ['fiji', 'bali'])).toBe('open')
    expect(regionLockState('individual', locked, ['fiji', 'bali'])).toBe('locked')
  })

  it('individual with no picks behaves like free', () => {
    expect(regionLockState('individual', locked)).toBe('locked')
    expect(regionLockState('individual', flagship)).toBe('open')
  })
})

describe('countryLockState', () => {
  it('opens only when every member region is open', () => {
    expect(countryLockState('premium', [locked, picked])).toBe('open')
    expect(countryLockState('free', [flagship, flagship])).toBe('open')
    expect(countryLockState('free', [flagship, locked])).toBe('locked')
  })

  it('opens for an individual who picked every member region', () => {
    expect(countryLockState('individual', [{ slug: 'bali' }, { slug: 'lombok' }], ['bali', 'lombok'])).toBe('open')
    expect(countryLockState('individual', [{ slug: 'bali' }, { slug: 'lombok' }], ['bali'])).toBe('locked')
  })

  it('locks an empty country', () => {
    expect(countryLockState('premium', [])).toBe('locked')
  })
})

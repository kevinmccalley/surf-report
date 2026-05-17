import { describe, it, expect } from 'vitest'
import { findCalibration, applyCalibration } from '../spot-calibration'
import { computeSurfRating } from '../surf-rating'

// Helper — builds a VERY GOOD rating at the supplied Hs / period / wind
function ratingFor(hs: number, period: number, wind = 5) {
  return computeSurfRating(hs, period, hs * 0.85, period, wind)
}

// ── findCalibration ──────────────────────────────────────────────────────────

describe('findCalibration', () => {
  it('returns calibration for Pipeline coords', () => {
    const cal = findCalibration(21.6649, -158.0530)
    expect(cal).not.toBeNull()
    expect(cal!.name).toBe('Pipeline')
  })

  it('returns calibration when inside match radius', () => {
    // ~1.5 km south of Waimea Bay — within its 3 km radius but >3 km from Pipeline
    const cal = findCalibration(21.630, -158.0638)
    expect(cal).not.toBeNull()
    expect(cal!.name).toBe('Waimea Bay')
  })

  it('returns null for a generic beach far from any calibrated spot', () => {
    // Middle of the North Sea
    const cal = findCalibration(56.0, 3.0)
    expect(cal).toBeNull()
  })

  it('returns null when outside match radius', () => {
    // 20 km from Pipeline — well outside 3 km radius
    const cal = findCalibration(21.84, -158.05)
    expect(cal).toBeNull()
  })

  it('picks the nearest calibrated spot when two are close', () => {
    // Exactly at Rincon coords — should not match Lowers (300+ km away)
    const cal = findCalibration(34.3666, -119.4750)
    expect(cal?.name).toBe('Rincon')
  })
})

// ── applyCalibration — Pipeline ───────────────────────────────────────────────

describe('applyCalibration — Pipeline size threshold', () => {
  const pipeCal = findCalibration(21.6649, -158.0530)!

  it('caps at POOR when swell Hs is below minSwellM (1.5 m)', () => {
    // Generic formula would score this decent (1.4 m, 12 s, light wind)
    const base = ratingFor(1.4, 12)
    expect(base.label).not.toBe('POOR')
    const calibrated = applyCalibration(base, 1.4, 12, 305, pipeCal)
    expect(calibrated.label).toBe('POOR')
  })

  it('does not degrade when Hs is above minSwellM', () => {
    // 2.0 m, 14 s, optimal NW direction — should be at least GOOD
    const base = ratingFor(2.0, 14)
    const calibrated = applyCalibration(base, 2.0, 14, 305, pipeCal)
    expect(['GOOD', 'VERY GOOD', 'EPIC']).toContain(calibrated.label)
  })

  it('does not degrade a FLAT rating', () => {
    const flat = computeSurfRating(0.05, 3, 0.04, 3, 5)
    const calibrated = applyCalibration(flat, 0.05, 3, 305, pipeCal)
    expect(calibrated.label).toBe('FLAT')
  })
})

describe('applyCalibration — Pipeline direction penalty', () => {
  const pipeCal = findCalibration(21.6649, -158.0530)!

  it('no penalty for optimal NW swell (310°)', () => {
    const base = ratingFor(2.0, 14)
    const calibrated = applyCalibration(base, 2.0, 14, 310, pipeCal)
    expect(calibrated.label).toBe(base.label)
  })

  it('minor penalty (cap at FAIR) for slightly off-direction swell', () => {
    // 350° = NNW, ~25-30° outside the 293-325 window; within default tolerance
    const base = ratingFor(2.0, 14)
    // Should at most be FAIR (minor penalty)
    const calibrated = applyCalibration(base, 2.0, 14, 350, pipeCal)
    const validLabels = ['FLAT', 'POOR', 'POOR TO FAIR', 'FAIR']
    expect(validLabels).toContain(calibrated.label)
  })

  it('major penalty for very wrong direction swell', () => {
    // 90° = East — completely wrong for Pipeline
    const base = ratingFor(2.0, 14)
    const calibrated = applyCalibration(base, 2.0, 14, 90, pipeCal)
    expect(['FLAT', 'POOR', 'POOR TO FAIR']).toContain(calibrated.label)
  })
})

describe('applyCalibration — Pipeline period penalty', () => {
  const pipeCal = findCalibration(21.6649, -158.0530)!

  it('drops one level when model shows long wavePeriod but short swellPeriod', () => {
    // wavePeriod=16 (boosts generic score via effectivePeriod) but swellPeriod=10 (< minPeriod=12)
    // Generic formula rates this EPIC; calibration should cap it one level lower at VERY GOOD
    const base = computeSurfRating(3.0, 16, 2.5, 10, 5)
    expect(base.label).toBe('EPIC')
    const calibrated = applyCalibration(base, 3.0, 10, 305, pipeCal)
    expect(calibrated.label).toBe('VERY GOOD')
  })

  it('period penalty does not push below POOR', () => {
    // Already capped at POOR by size; short period should not push to FLAT
    const base = ratingFor(1.0, 8)  // 1.0 m < 1.5 m minSwellM → POOR cap
    const calibrated = applyCalibration(base, 1.0, 8, 305, pipeCal)
    expect(calibrated.label).toBe('POOR')
  })
})

// ── applyCalibration — Waimea Bay (big wave) ──────────────────────────────────

describe('applyCalibration — Waimea Bay size threshold', () => {
  const waiCal = findCalibration(21.6432, -158.0638)!

  it('caps at POOR for 1.5 m swell (below 2.5 m minimum)', () => {
    const base = ratingFor(1.5, 14)
    const calibrated = applyCalibration(base, 1.5, 14, 310, waiCal)
    expect(calibrated.label).toBe('POOR')
  })

  it('allows GOOD+ at 3.0 m with optimal direction', () => {
    const base = ratingFor(3.0, 16)
    const calibrated = applyCalibration(base, 3.0, 16, 310, waiCal)
    expect(['GOOD', 'VERY GOOD', 'EPIC']).toContain(calibrated.label)
  })
})

// ── applyCalibration — Thurso East (wrapping N-facing window) ────────────────

describe('applyCalibration — Thurso East direction (wraps through 0°)', () => {
  const thurCal = findCalibration(58.5928, -3.5062)!

  it('no penalty for NNE swell (20°)', () => {
    const base = ratingFor(1.0, 12)
    const calibrated = applyCalibration(base, 1.0, 12, 20, thurCal)
    expect(calibrated.label).toBe(base.label)
  })

  it('no penalty for N swell (355°) — inside wrapping window [345,60]', () => {
    const base = ratingFor(1.0, 12)
    const calibrated = applyCalibration(base, 1.0, 12, 355, thurCal)
    expect(calibrated.label).toBe(base.label)
  })

  it('penalises SW swell (225°) — completely wrong direction', () => {
    const base = ratingFor(1.0, 12)
    const calibrated = applyCalibration(base, 1.0, 12, 225, thurCal)
    expect(['FLAT', 'POOR', 'POOR TO FAIR']).toContain(calibrated.label)
  })
})

// ── applyCalibration — no change for uncalibrated locations ──────────────────

describe('findCalibration returns null → rating unchanged', () => {
  it('rating is not modified when no calibration found', () => {
    const base = ratingFor(1.5, 14)
    // No calibration at these coords — result should equal base
    const cal = findCalibration(56.0, 3.0)
    expect(cal).toBeNull()
    // Simulate the route pattern
    const result = cal ? applyCalibration(base, 1.5, 14, 300, cal) : base
    expect(result).toBe(base)
  })
})

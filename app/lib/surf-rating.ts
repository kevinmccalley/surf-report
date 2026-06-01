import type { SurfRating, SurfRatingLabel } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Wind score (0–3).
 *
 * Without direction data → speed-only penalty (original behaviour, used for
 * uncalibrated spots).
 *
 * With direction data → compound model: the break's facing direction tells us
 * where "dead offshore" is, offshoreness = cos(angle from dead offshore),
 * and wind speed amplifies the effect in either direction.
 *
 *   Offshore 20 km/h  →  3.0 (groomed faces, max score)
 *   Glassy < 5 km/h   →  3.0 (glassy is equally great)
 *   Cross-shore        →  same as speed-only baseline
 *   Onshore 20 km/h   →  ~0  (choppy, heavily penalised)
 */
function computeWindScore(
  windSpeed: number,
  windDirection?: number,
  facingDirection?: number,
): number {
  // Speed-only baseline — used directly when direction data is unavailable,
  // or as the starting point for the compound model below.
  const speedScore =
    windSpeed < 8  ? 3.0 :
    windSpeed < 15 ? 2.4 :
    windSpeed < 22 ? 1.6 :
    windSpeed < 30 ? 0.8 :
    windSpeed < 40 ? 0.3 : 0

  if (windDirection === undefined || facingDirection === undefined) {
    return speedScore
  }

  // Offshoreness: +1 = dead offshore, 0 = cross-shore, -1 = dead onshore.
  // "Dead offshore" is the wind direction 180° opposite the break's facing
  // direction (i.e. blowing FROM behind the break TOWARDS the ocean).
  const deadOffshoreDir = (facingDirection + 180) % 360
  const degreesFromOffshore = angularDiff(windDirection, deadOffshoreDir)
  const offshoreness = Math.cos(degreesFromOffshore * Math.PI / 180)

  // Speed amplifier: 0 at calm, ramps linearly to 1.0 at 30 km/h, then
  // tapers at extreme speeds (even offshore 50 km/h starts creating spray).
  const speedAmp =
    windSpeed <= 5  ? 0 :
    windSpeed <= 30 ? (windSpeed - 5) / 25 :
    Math.max(0, 1 - (windSpeed - 30) / 40)

  // Directional effect: ±2.0 at full amplifier.
  // Positive = offshore lifts score; negative = onshore hammers it.
  const directionalEffect = offshoreness * speedAmp * 2.0

  return Math.max(0, Math.min(3.0, speedScore + directionalEffect))
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeSurfRating(
  waveHeight: number,
  wavePeriod: number,
  swellHeight: number,
  swellPeriod: number,
  windSpeed: number,
  windDirection?: number,
  facingDirection?: number,
): SurfRating {
  if (waveHeight < 0.15) {
    return { label: 'FLAT', score: 0, color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)', textColor: '#9ca3af' }
  }

  // Height score (0–4)
  let heightScore: number
  if (waveHeight < 0.3) heightScore = 0.5
  else if (waveHeight < 0.6) heightScore = 1.5
  else if (waveHeight < 0.9) heightScore = 2.5
  else if (waveHeight < 1.5) heightScore = 3.2
  else if (waveHeight < 2.0) heightScore = 3.7
  else if (waveHeight < 3.0) heightScore = 4.0
  else if (waveHeight < 4.5) heightScore = 3.8
  else heightScore = 3.2

  // Period score (0–3) — longer = cleaner, more powerful
  const effectivePeriod = Math.max(wavePeriod, swellPeriod)
  let periodScore: number
  if (effectivePeriod < 6) periodScore = 0
  else if (effectivePeriod < 8) periodScore = 0.6
  else if (effectivePeriod < 10) periodScore = 1.2
  else if (effectivePeriod < 12) periodScore = 1.7
  else if (effectivePeriod < 15) periodScore = 2.2
  else if (effectivePeriod < 18) periodScore = 2.7
  else periodScore = 3.0

  // Wind score (0–3) — direction-aware when facing data is available
  const windScore = computeWindScore(windSpeed, windDirection, facingDirection)

  const totalScore = heightScore + periodScore + windScore

  let label: SurfRatingLabel
  let color: string
  let bgColor: string
  let textColor: string

  if (totalScore < 1.5) {
    label = 'POOR'; color = '#ef4444'; bgColor = 'rgba(239,68,68,0.15)'; textColor = '#fca5a5'
  } else if (totalScore < 3.5) {
    label = 'POOR TO FAIR'; color = '#f97316'; bgColor = 'rgba(249,115,22,0.15)'; textColor = '#fdba74'
  } else if (totalScore < 5.0) {
    label = 'FAIR'; color = '#eab308'; bgColor = 'rgba(234,179,8,0.15)'; textColor = '#fde047'
  } else if (totalScore < 6.5) {
    label = 'FAIR TO GOOD'; color = '#84cc16'; bgColor = 'rgba(132,204,22,0.15)'; textColor = '#bef264'
  } else if (totalScore < 7.8) {
    label = 'GOOD'; color = '#22c55e'; bgColor = 'rgba(34,197,94,0.15)'; textColor = '#86efac'
  } else if (totalScore < 9.0) {
    label = 'VERY GOOD'; color = '#0ea5e9'; bgColor = 'rgba(14,165,233,0.15)'; textColor = '#7dd3fc'
  } else {
    label = 'EPIC'; color = '#a855f7'; bgColor = 'rgba(168,85,247,0.15)'; textColor = '#d8b4fe'
  }

  return { label, score: totalScore, color, bgColor, textColor }
}

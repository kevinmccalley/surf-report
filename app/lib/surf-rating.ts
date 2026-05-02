import type { SurfRating, SurfRatingLabel } from './types'

export function computeSurfRating(
  waveHeight: number,
  wavePeriod: number,
  swellHeight: number,
  swellPeriod: number,
  windSpeed: number
): SurfRating {
  if (waveHeight < 0.15) {
    return { label: 'FLAT', score: 0, color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)', textColor: '#9ca3af' }
  }

  // Height score (0-4)
  let heightScore: number
  if (waveHeight < 0.3) heightScore = 0.5
  else if (waveHeight < 0.6) heightScore = 1.5
  else if (waveHeight < 0.9) heightScore = 2.5
  else if (waveHeight < 1.5) heightScore = 3.2
  else if (waveHeight < 2.0) heightScore = 3.7
  else if (waveHeight < 3.0) heightScore = 4.0
  else if (waveHeight < 4.5) heightScore = 3.8
  else heightScore = 3.2

  // Period score (0-3) — longer = cleaner, more powerful
  const effectivePeriod = Math.max(wavePeriod, swellPeriod)
  let periodScore: number
  if (effectivePeriod < 6) periodScore = 0
  else if (effectivePeriod < 8) periodScore = 0.6
  else if (effectivePeriod < 10) periodScore = 1.2
  else if (effectivePeriod < 12) periodScore = 1.7
  else if (effectivePeriod < 15) periodScore = 2.2
  else if (effectivePeriod < 18) periodScore = 2.7
  else periodScore = 3.0

  // Wind score (0-3) — calm = better
  let windScore: number
  if (windSpeed < 8) windScore = 3.0
  else if (windSpeed < 15) windScore = 2.4
  else if (windSpeed < 22) windScore = 1.6
  else if (windSpeed < 30) windScore = 0.8
  else if (windSpeed < 40) windScore = 0.3
  else windScore = 0

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

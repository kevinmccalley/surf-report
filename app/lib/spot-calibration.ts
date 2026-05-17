import type { SurfRating, SurfRatingLabel } from './types'

export interface SpotCalibration {
  name: string
  lat: number
  lon: number
  matchRadiusKm: number
  minSwellM: number      // cap at POOR if swell Hs below this
  minPeriod?: number     // drop one level if period below this
  dirMin?: number        // optimal swell direction window (degrees, 0-359)
  dirMax?: number        // dirMin > dirMax means wraps through 0° (e.g. N-facing breaks)
  dirTolerance?: number  // degrees beyond window before penalty applies (default 25)
}

const LABELS: SurfRatingLabel[] = [
  'FLAT', 'POOR', 'POOR TO FAIR', 'FAIR', 'FAIR TO GOOD', 'GOOD', 'VERY GOOD', 'EPIC',
]

const CANONICAL: Record<SurfRatingLabel, SurfRating> = {
  'FLAT':         { label: 'FLAT',         score: 0,   color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)', textColor: '#9ca3af' },
  'POOR':         { label: 'POOR',         score: 1.0, color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)',   textColor: '#fca5a5' },
  'POOR TO FAIR': { label: 'POOR TO FAIR', score: 2.5, color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', textColor: '#fdba74' },
  'FAIR':         { label: 'FAIR',         score: 4.2, color: '#eab308', bgColor: 'rgba(234,179,8,0.15)',   textColor: '#fde047' },
  'FAIR TO GOOD': { label: 'FAIR TO GOOD', score: 5.7, color: '#84cc16', bgColor: 'rgba(132,204,22,0.15)', textColor: '#bef264' },
  'GOOD':         { label: 'GOOD',         score: 7.0, color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)',   textColor: '#86efac' },
  'VERY GOOD':    { label: 'VERY GOOD',    score: 8.4, color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.15)', textColor: '#7dd3fc' },
  'EPIC':         { label: 'EPIC',         score: 9.5, color: '#a855f7', bgColor: 'rgba(168,85,247,0.15)', textColor: '#d8b4fe' },
}

// ~27 curated calibrations covering the world's most size/direction-sensitive breaks.
// Coordinates match surf-spots.ts; matchRadiusKm ensures correct spot matching even
// when users search a nearby town or zoom into a tight cluster (e.g. Pipeline reef).
const CALIBRATED_SPOTS: SpotCalibration[] = [

  // ── Hawaii ──────────────────────────────────────────────────────────────────
  // 3 km radius covers Pipeline, Backdoor, Off The Wall, Rocky Point — same reef
  { name: 'Pipeline',      lat:  21.6649, lon: -158.0530, matchRadiusKm:  3, minSwellM: 1.5, minPeriod: 12, dirMin: 293, dirMax: 325 },
  { name: 'Sunset Beach',  lat:  21.6786, lon: -158.0404, matchRadiusKm:  3, minSwellM: 1.2, minPeriod: 11, dirMin: 288, dirMax: 340 },
  { name: 'Waimea Bay',    lat:  21.6432, lon: -158.0638, matchRadiusKm:  3, minSwellM: 2.5, minPeriod: 12, dirMin: 290, dirMax: 340 },
  { name: 'Jaws',          lat:  20.9464, lon: -156.3014, matchRadiusKm:  8, minSwellM: 3.0, minPeriod: 14, dirMin: 295, dirMax: 345 },
  { name: 'Honolua Bay',   lat:  21.0145, lon: -156.6395, matchRadiusKm:  5, minSwellM: 0.6, minPeriod: 12, dirMin: 285, dirMax: 338 },

  // ── California ──────────────────────────────────────────────────────────────
  { name: 'Mavericks',     lat:  37.4920, lon: -122.5006, matchRadiusKm:  8, minSwellM: 2.0, minPeriod: 14, dirMin: 285, dirMax: 320 },
  { name: 'Ghost Tree',    lat:  36.5568, lon: -121.9618, matchRadiusKm:  8, minSwellM: 2.5, minPeriod: 14, dirMin: 270, dirMax: 315 },
  // Channel Islands block NW swells; Rincon needs S-WNW (wide tolerance for NW wrap-around)
  { name: 'Rincon',        lat:  34.3666, lon: -119.4750, matchRadiusKm:  5, minSwellM: 0.4,               dirMin: 210, dirMax: 290, dirTolerance: 30 },
  { name: 'Lowers',        lat:  33.3836, lon: -117.5897, matchRadiusKm:  4, minSwellM: 0.4,               dirMin: 195, dirMax: 265 },

  // ── Mexico ───────────────────────────────────────────────────────────────────
  { name: 'Puerto Escondido', lat: 15.8581, lon: -97.0686, matchRadiusKm: 5, minSwellM: 0.8, minPeriod: 12, dirMin: 195, dirMax: 240 },

  // ── South America ────────────────────────────────────────────────────────────
  { name: 'Punta de Lobos', lat: -34.4000, lon: -71.9167, matchRadiusKm: 5, minSwellM: 0.6, dirMin: 215, dirMax: 265 },

  // ── Portugal ─────────────────────────────────────────────────────────────────
  // Nazaré submarine canyon amplifies NW swells but needs serious base Hs
  { name: 'Praia do Norte', lat:  39.6015, lon:  -9.0710, matchRadiusKm:  8, minSwellM: 3.0, minPeriod: 14, dirMin: 285, dirMax: 330 },
  { name: 'Supertubos',     lat:  39.3458, lon:  -9.3883, matchRadiusKm:  4, minSwellM: 0.4,               dirMin: 278, dirMax: 345 },

  // ── France & Spain ───────────────────────────────────────────────────────────
  { name: 'La Graviere',    lat:  43.6654, lon:  -1.4438, matchRadiusKm:  4, minSwellM: 0.5,               dirMin: 258, dirMax: 308 },
  { name: 'Mundaka',        lat:  43.4078, lon:  -2.6993, matchRadiusKm:  4, minSwellM: 0.6, minPeriod: 11, dirMin: 262, dirMax: 318 },

  // ── UK & Ireland ─────────────────────────────────────────────────────────────
  // Thurso East faces NE — wrapping direction window through 0°
  { name: 'Thurso East',    lat:  58.5928, lon:  -3.5062, matchRadiusKm:  5, minSwellM: 0.5,               dirMin: 345, dirMax:  60 },
  { name: 'Mullaghmore',    lat:  54.4655, lon:  -8.4495, matchRadiusKm:  8, minSwellM: 2.5, minPeriod: 14, dirMin: 262, dirMax: 315 },

  // ── South Africa ─────────────────────────────────────────────────────────────
  { name: 'Supertubes',     lat: -34.0481, lon:  24.9313, matchRadiusKm:  5, minSwellM: 0.6,               dirMin: 200, dirMax: 250 },
  { name: 'Skeleton Bay',   lat: -22.9376, lon:  14.4175, matchRadiusKm:  5, minSwellM: 0.8,               dirMin: 175, dirMax: 230 },

  // ── Morocco ──────────────────────────────────────────────────────────────────
  { name: 'Anchor Point',   lat:  30.5450, lon:  -9.7258, matchRadiusKm:  4, minSwellM: 0.5,               dirMin: 268, dirMax: 320 },

  // ── Indonesia ────────────────────────────────────────────────────────────────
  { name: 'Uluwatu',        lat:  -8.8292, lon: 115.0849, matchRadiusKm:  4, minSwellM: 0.5, minPeriod: 10, dirMin: 205, dirMax: 255 },
  { name: 'Padang Padang',  lat:  -8.8110, lon: 115.0877, matchRadiusKm:  3, minSwellM: 0.9, minPeriod: 12, dirMin: 210, dirMax: 245 },
  { name: 'G-Land',         lat:  -8.6590, lon: 114.3710, matchRadiusKm:  6, minSwellM: 0.7, minPeriod: 11, dirMin: 185, dirMax: 230 },

  // ── Tahiti ───────────────────────────────────────────────────────────────────
  { name: "Teahupo'o",      lat: -17.8417, lon: -149.2670, matchRadiusKm: 5, minSwellM: 0.7, minPeriod: 11, dirMin: 200, dirMax: 245 },

  // ── Fiji ─────────────────────────────────────────────────────────────────────
  { name: 'Cloudbreak',     lat: -17.8577, lon: 177.2018, matchRadiusKm:  5, minSwellM: 0.7,               dirMin: 215, dirMax: 268 },

  // ── Australia ────────────────────────────────────────────────────────────────
  { name: 'Bells Beach',    lat: -38.3677, lon: 144.2829, matchRadiusKm:  5, minSwellM: 0.7,               dirMin: 210, dirMax: 262 },
  { name: 'Snapper Rocks',  lat: -28.1575, lon: 153.5538, matchRadiusKm:  4, minSwellM: 0.3,               dirMin:  75, dirMax: 145 },
]

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function dirPenalty(
  swellDir: number,
  dirMin: number,
  dirMax: number,
  tolerance: number,
): 'none' | 'minor' | 'major' {
  const inside = dirMin <= dirMax
    ? swellDir >= dirMin && swellDir <= dirMax
    : swellDir >= dirMin || swellDir <= dirMax  // wraps through 0°

  if (inside) return 'none'

  const distToEdge = Math.min(angularDiff(swellDir, dirMin), angularDiff(swellDir, dirMax))
  return distToEdge <= tolerance ? 'minor' : 'major'
}

export function findCalibration(lat: number, lon: number): SpotCalibration | null {
  let best: SpotCalibration | null = null
  let bestDist = Infinity
  for (const spot of CALIBRATED_SPOTS) {
    const dist = haversineKm(lat, lon, spot.lat, spot.lon)
    if (dist < spot.matchRadiusKm && dist < bestDist) {
      bestDist = dist
      best = spot
    }
  }
  return best
}

/**
 * Adjusts a generic surf rating based on break-specific requirements.
 * Builds a cap (maximum achievable label) from three independent penalties
 * then returns the lower of the computed rating and the cap.
 *
 * @param rating      The rating produced by computeSurfRating()
 * @param swellHeight Raw swell Hs in metres (unscaled)
 * @param swellPeriod Dominant swell period in seconds
 * @param swellDir    Swell direction in degrees (0-359, oceanographic convention)
 * @param cal         Calibration for the matched spot
 */
export function applyCalibration(
  rating: SurfRating,
  swellHeight: number,
  swellPeriod: number,
  swellDir: number,
  cal: SpotCalibration,
): SurfRating {
  if (rating.label === 'FLAT') return rating

  // Start with no cap (EPIC = index 7)
  let capIdx = LABELS.length - 1

  // 1. Size: below break's minimum → cap at POOR
  if (swellHeight < cal.minSwellM) {
    capIdx = Math.min(capIdx, LABELS.indexOf('POOR'))
  }

  // 2. Direction: outside optimal window → cap 1 or 2 levels lower
  if (cal.dirMin !== undefined && cal.dirMax !== undefined) {
    const tol = cal.dirTolerance ?? 25
    const penalty = dirPenalty(swellDir, cal.dirMin, cal.dirMax, tol)
    if (penalty === 'minor') {
      capIdx = Math.min(capIdx, LABELS.indexOf('FAIR'))
    } else if (penalty === 'major') {
      capIdx = Math.min(capIdx, LABELS.indexOf('POOR TO FAIR'))
    }
  }

  // 3. Period: below minimum → drop the cap one additional level (floor: POOR)
  if (cal.minPeriod !== undefined && swellPeriod < cal.minPeriod) {
    capIdx = Math.max(LABELS.indexOf('POOR'), capIdx - 1)
  }

  // Apply cap to the computed rating
  const ratingIdx = LABELS.indexOf(rating.label)
  const finalIdx = Math.min(ratingIdx, capIdx)
  const finalLabel = LABELS[finalIdx]

  return finalLabel === rating.label ? rating : CANONICAL[finalLabel]
}

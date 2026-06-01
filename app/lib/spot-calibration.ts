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
  facingDirection?: number  // direction the break faces (where waves arrive FROM, 0-359)
                            // offshore wind = (facingDirection + 180) % 360
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
  // facingDirection = midpoint of optimal swell window; offshore = facingDir + 180
  // Pipeline faces NW: classic SE trades (135°) are the offshore wind
  { name: 'Pipeline',      lat:  21.6649, lon: -158.0530, matchRadiusKm:  3, minSwellM: 1.5, minPeriod: 12, dirMin: 293, dirMax: 325, facingDirection: 309 },
  { name: 'Sunset Beach',  lat:  21.6786, lon: -158.0404, matchRadiusKm:  3, minSwellM: 1.2, minPeriod: 11, dirMin: 288, dirMax: 340, facingDirection: 314 },
  { name: 'Waimea Bay',    lat:  21.6432, lon: -158.0638, matchRadiusKm:  3, minSwellM: 2.5, minPeriod: 12, dirMin: 290, dirMax: 340, facingDirection: 315 },
  { name: 'Jaws',          lat:  20.9464, lon: -156.3014, matchRadiusKm:  8, minSwellM: 3.0, minPeriod: 14, dirMin: 295, dirMax: 345, facingDirection: 320 },
  { name: 'Honolua Bay',   lat:  21.0145, lon: -156.6395, matchRadiusKm:  5, minSwellM: 0.6, minPeriod: 12, dirMin: 285, dirMax: 338, facingDirection: 312 },

  // ── California ──────────────────────────────────────────────────────────────
  { name: 'Mavericks',     lat:  37.4920, lon: -122.5006, matchRadiusKm:  8, minSwellM: 2.0, minPeriod: 14, dirMin: 285, dirMax: 320, facingDirection: 303 },
  { name: 'Ghost Tree',    lat:  36.5568, lon: -121.9618, matchRadiusKm:  8, minSwellM: 2.5, minPeriod: 14, dirMin: 270, dirMax: 315, facingDirection: 293 },
  // Channel Islands block NW swells; Rincon needs S-WNW (wide tolerance for NW wrap-around)
  { name: 'Rincon',        lat:  34.3666, lon: -119.4750, matchRadiusKm:  5, minSwellM: 0.4,               dirMin: 210, dirMax: 290, dirTolerance: 30, facingDirection: 250 },
  { name: 'Lowers',        lat:  33.3836, lon: -117.5897, matchRadiusKm:  4, minSwellM: 0.4,               dirMin: 195, dirMax: 265, facingDirection: 230 },

  // ── Mexico ───────────────────────────────────────────────────────────────────
  { name: 'Puerto Escondido', lat: 15.8581, lon: -97.0686, matchRadiusKm: 5, minSwellM: 0.8, minPeriod: 12, dirMin: 195, dirMax: 240, facingDirection: 218 },

  // ── South America ────────────────────────────────────────────────────────────
  { name: 'Punta de Lobos', lat: -34.4000, lon: -71.9167, matchRadiusKm: 5, minSwellM: 0.6, dirMin: 215, dirMax: 265, facingDirection: 240 },

  // ── Portugal ─────────────────────────────────────────────────────────────────
  // Nazaré submarine canyon amplifies NW swells but needs serious base Hs
  { name: 'Praia do Norte', lat:  39.6015, lon:  -9.0710, matchRadiusKm:  8, minSwellM: 3.0, minPeriod: 14, dirMin: 285, dirMax: 330, facingDirection: 308 },
  { name: 'Supertubos',     lat:  39.3458, lon:  -9.3883, matchRadiusKm:  4, minSwellM: 0.4,               dirMin: 278, dirMax: 345, facingDirection: 312 },

  // ── France & Spain ───────────────────────────────────────────────────────────
  { name: 'La Graviere',    lat:  43.6654, lon:  -1.4438, matchRadiusKm:  4, minSwellM: 0.5,               dirMin: 258, dirMax: 308, facingDirection: 283 },
  { name: 'Mundaka',        lat:  43.4078, lon:  -2.6993, matchRadiusKm:  4, minSwellM: 0.6, minPeriod: 11, dirMin: 262, dirMax: 318, facingDirection: 290 },

  // ── UK & Ireland ─────────────────────────────────────────────────────────────
  // Thurso East faces NE — wrapping direction window through 0°; offshore = SW (225°)
  { name: 'Thurso East',    lat:  58.5928, lon:  -3.5062, matchRadiusKm:  5, minSwellM: 0.5,               dirMin: 345, dirMax:  60, facingDirection:  22 },
  { name: 'Mullaghmore',    lat:  54.4655, lon:  -8.4495, matchRadiusKm:  8, minSwellM: 2.5, minPeriod: 14, dirMin: 262, dirMax: 315, facingDirection: 289 },

  // ── South Africa ─────────────────────────────────────────────────────────────
  { name: 'Supertubes',     lat: -34.0481, lon:  24.9313, matchRadiusKm:  5, minSwellM: 0.6,               dirMin: 200, dirMax: 250, facingDirection: 225 },
  { name: 'Skeleton Bay',   lat: -22.9376, lon:  14.4175, matchRadiusKm:  5, minSwellM: 0.8,               dirMin: 175, dirMax: 230, facingDirection: 203 },

  // ── Morocco ──────────────────────────────────────────────────────────────────
  { name: 'Anchor Point',   lat:  30.5450, lon:  -9.7258, matchRadiusKm:  4, minSwellM: 0.5,               dirMin: 268, dirMax: 320, facingDirection: 294 },

  // ── Indonesia ────────────────────────────────────────────────────────────────
  { name: 'Uluwatu',        lat:  -8.8292, lon: 115.0849, matchRadiusKm:  4, minSwellM: 0.5, minPeriod: 10, dirMin: 205, dirMax: 255, facingDirection: 230 },
  { name: 'Padang Padang',  lat:  -8.8110, lon: 115.0877, matchRadiusKm:  3, minSwellM: 0.9, minPeriod: 12, dirMin: 210, dirMax: 245, facingDirection: 228 },
  { name: 'G-Land',         lat:  -8.6590, lon: 114.3710, matchRadiusKm:  6, minSwellM: 0.7, minPeriod: 11, dirMin: 185, dirMax: 230, facingDirection: 208 },

  // ── Tahiti ───────────────────────────────────────────────────────────────────
  { name: "Teahupo'o",      lat: -17.8417, lon: -149.2670, matchRadiusKm: 5, minSwellM: 0.7, minPeriod: 11, dirMin: 200, dirMax: 245, facingDirection: 223 },

  // ── Fiji ─────────────────────────────────────────────────────────────────────
  { name: 'Cloudbreak',     lat: -17.8577, lon: 177.2018, matchRadiusKm:  5, minSwellM: 0.7,               dirMin: 215, dirMax: 268, facingDirection: 242 },

  // ── Australia ────────────────────────────────────────────────────────────────
  { name: 'Bells Beach',    lat: -38.3677, lon: 144.2829, matchRadiusKm:  5, minSwellM: 0.7,               dirMin: 210, dirMax: 262, facingDirection: 236 },
  // Snapper faces ESE (110°); offshore = WNW (290°) — classic SW winds are offshore
  { name: 'Snapper Rocks',  lat: -28.1575, lon: 153.5538, matchRadiusKm:  4, minSwellM: 0.3,               dirMin:  75, dirMax: 145, facingDirection: 110 },
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

// ── Automatic facing-direction inference ──────────────────────────────────────
//
// For any lat/lon we don't have a hand-calibrated facingDirection for, probe
// 8 equidistant bearings at 15 km and ask the Open-Meteo marine API which
// points are over ocean (return non-null wave height).  The circular mean of
// all ocean-bearing directions is the spot's facing direction.
//
// Result is cached in Vercel KV under "facing:<lat>:<lon>" for one year so
// every unique location is computed at most once.

const PROBE_RADIUS_KM = 15
const NUM_PROBES = 8

function probeLatLon(
  lat: number, lon: number, bearingDeg: number
): { lat: number; lon: number } {
  const R = 6371
  const d = PROBE_RADIUS_KM / R
  const brng = (bearingDeg * Math.PI) / 180
  const lat1 = (lat * Math.PI) / 180
  const lon1 = (lon * Math.PI) / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )
  return { lat: (lat2 * 180) / Math.PI, lon: (lon2 * 180) / Math.PI }
}

async function probeIsOcean(lat: number, lon: number): Promise<boolean> {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat.toFixed(5)}&longitude=${lon.toFixed(5)}` +
      `&hourly=wave_height&forecast_days=1&timezone=UTC`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return false
    const data = await res.json() as { hourly?: { wave_height?: (number | null)[] } }
    const first = data.hourly?.wave_height?.[0]
    return typeof first === 'number' && !isNaN(first)
  } catch {
    return false
  }
}

/**
 * Fire 8 parallel marine-API probes in a circle around the spot and return
 * the circular mean of whichever bearings come back as ocean.
 * Returns null if fewer than 2 probes respond as ocean (land-locked or API
 * error — caller should fall back to speed-only wind scoring).
 */
export async function inferFacingDirection(
  lat: number,
  lon: number,
): Promise<number | null> {
  const bearings = Array.from({ length: NUM_PROBES }, (_, i) => (i * 360) / NUM_PROBES)

  const results = await Promise.all(
    bearings.map(async (bearing) => {
      const pt = probeLatLon(lat, lon, bearing)
      const isOcean = await probeIsOcean(pt.lat, pt.lon)
      return { bearing, isOcean }
    })
  )

  const oceanBearings = results.filter((r) => r.isOcean).map((r) => r.bearing)
  if (oceanBearings.length < 2) return null

  // Circular mean
  const sinSum = oceanBearings.reduce((s, b) => s + Math.sin((b * Math.PI) / 180), 0)
  const cosSum = oceanBearings.reduce((s, b) => s + Math.cos((b * Math.PI) / 180), 0)
  const mean = (Math.atan2(sinSum, cosSum) * 180) / Math.PI
  return Math.round((mean + 360) % 360)
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

import { getAllSpots, slugify } from './surf-spots'
import { SPOTS as TOP100 } from '../top100/spots-data'
import type { Top100Spot } from '../top100/spots-data'
import notableRaw from './notable-spots.json'

export const REGIONS = [
  'Hawaii',
  'North America',
  'Latin America',
  'Europe',
  'Africa & Atlantic',
  'Indian Ocean',
  'Southeast Asia',
  'Oceania & Pacific',
] as const

export type Region = typeof REGIONS[number]
export type WaveType = 'Reef Break' | 'Beach Break' | 'Point Break' | 'River Mouth' | 'Sand Bar'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface DirectorySpot {
  name: string
  locality: string
  region: Region
  lat: number
  lon: number
  slug: string
  href: string
  waveType?: WaveType
  difficulty?: Difficulty
  bestSeason?: string
  wslBadge?: 'CT Stop' | 'Big Wave'
  top100Rank?: number
}

// ── Geometry helpers ────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Region lookup from country string (for surf-spots.ts entries) ────────────

function regionFromCountry(country: string): Region {
  const c = country.toLowerCase()
  if (/\b(oahu|maui|kauai|molokai|hawaii)\b/.test(c)) return 'Hawaii'
  if (/, (ca|fl|nc|sc|ny|nj|ma|ct|me|va|ga)$/i.test(country)) return 'North America'
  if (/\b(california|florida|north carolina|south carolina|new york|new jersey|massachusetts|cocoa beach|montauk|manasquan|asbury park|nantucket|buxton|kill devil hills|folly beach|carolina|mid-atlantic|new england|oregon)\b/.test(c)) return 'North America'
  if (/\b(canada|british columbia|nova scotia)\b/.test(c)) return 'North America'
  if (/\b(puerto rico|rincón|rincon|mexico|baja|oaxaca|nayarit|colima|guerrero|michoacán|michoacan|guanacaste|puntarenas|dominical|la libertad|la unión|peru|chile|brazil|pernambuco|rio de janeiro|santa catarina|imbituba)\b/.test(c)) return 'Latin America'
  if (/\b(argentina|colombia|ecuador|venezuela|panama|nicaragua|honduras|guatemala|costa rica|caribbean|cuba|jamaica)\b/.test(c)) return 'Latin America'
  if (/tahiti|french polynesia/.test(c)) return 'Oceania & Pacific'
  if (/réunion|reunion/.test(c)) return 'Indian Ocean'
  if (/\b(portugal|peniche|nazaré|nazare|ericeira|sagres|cascais|france|hossegor|biarritz|lacanau|anglet|spain|basque|galicia|lanzarote|canary|gran canaria|cornwall|devon|newquay|scotland|ireland|donegal|sligo|clare|north devon|united kingdom)\b/.test(c)) return 'Europe'
  if (/\buk\b/.test(c)) return 'Europe'
  if (/\b(azores)\b/.test(c)) return 'Africa & Atlantic'
  if (/\b(morocco|taghazout|safi|south africa|jeffrey|durban|hout bay|george|western cape|namibia|walvis)\b/.test(c)) return 'Africa & Atlantic'
  if (/\b(maldives|malé|male|north mal|sri lanka|mauritius)\b/.test(c)) return 'Indian Ocean'
  if (/\b(bali|uluwatu|bukit|gianyar|canggu|java|lombok|mentawai|nias|indonesia|japan|chiba)\b/.test(c)) return 'Southeast Asia'
  if (/\b(australia|western australia|victoria|queensland|new south wales|tasmania|margaret river|yallingup|kalbarri|new zealand|waikato|auckland|fiji|tavarua|pacific harbour|namotu)\b/.test(c)) return 'Oceania & Pacific'
  if (/\bnsw\b/.test(c)) return 'Oceania & Pacific'
  return 'North America'
}

// ── Locality + region from coordinates (for notable-spots entries) ───────────
// Returns [locality string, Region]. Empty locality means unrecognised location.

function localityAndRegion(lat: number, lon: number): [string, Region] {
  // Hawaii
  if (lat >= 18 && lat <= 23 && lon >= -162 && lon <= -154) return ['Hawaii, USA', 'Hawaii']
  // Pacific Canada
  if (lat >= 48 && lat <= 52 && lon >= -130 && lon <= -122) return ['British Columbia, Canada', 'North America']
  // Atlantic Canada
  if (lat >= 43 && lat <= 48 && lon >= -68 && lon <= -59) return ['Nova Scotia, Canada', 'North America']
  // US West Coast
  if (lat >= 32 && lat <= 42 && lon >= -125 && lon <= -116) return ['California, USA', 'North America']
  if (lat >= 42 && lat <= 50 && lon >= -125 && lon <= -116) return ['Oregon, USA', 'North America']
  // US East Coast (most specific first)
  if (lat >= 24 && lat <= 32 && lon >= -84 && lon <= -78) return ['Florida, USA', 'North America']
  if (lat >= 32 && lat <= 37 && lon >= -82 && lon <= -73) return ['Carolinas, USA', 'North America']
  if (lat >= 37 && lat <= 42 && lon >= -77 && lon <= -69) return ['Mid-Atlantic, USA', 'North America']
  if (lat >= 41 && lat <= 49 && lon >= -74 && lon <= -66) return ['New England, USA', 'North America']
  // Baja before broad Mexico
  if (lat >= 22 && lat <= 33 && lon >= -118 && lon <= -109) return ['Baja California, Mexico', 'Latin America']
  if (lat >= 14 && lat <= 23 && lon >= -106 && lon <= -86) return ['Mexico', 'Latin America']
  // Central America (before broad Caribbean)
  if (lat >= 7 && lat <= 12 && lon >= -86 && lon <= -77) return ['Costa Rica', 'Latin America']
  if (lat >= 12 && lat <= 18 && lon >= -93 && lon <= -83) return ['Guatemala', 'Latin America']
  if (lat >= 10 && lat <= 16 && lon >= -90 && lon <= -79) return ['Nicaragua', 'Latin America']
  if (lat >= 7 && lat <= 10 && lon >= -83 && lon <= -77) return ['Panama', 'Latin America']
  // Caribbean (broad)
  if (lat >= 14 && lat <= 27 && lon >= -89 && lon <= -59) return ['Caribbean', 'Latin America']
  // South America
  if (lat >= 0 && lat <= 14 && lon >= -82 && lon <= -59) return ['Colombia', 'Latin America']
  if (lat >= -5 && lat <= 2 && lon >= -82 && lon <= -74) return ['Ecuador', 'Latin America']
  if (lat >= -20 && lat <= -5 && lon >= -82 && lon <= -74) return ['Peru', 'Latin America']
  if (lat >= -56 && lat <= -17 && lon >= -76 && lon <= -65) return ['Chile', 'Latin America']
  if (lat >= -56 && lat <= -22 && lon >= -70 && lon <= -52) return ['Argentina', 'Latin America']
  if (lat >= -35 && lat <= 5 && lon >= -55 && lon <= -28) return ['Brazil', 'Latin America']
  // Atlantic islands
  if (lat >= 36 && lat <= 40 && lon >= -32 && lon <= -24) return ['Azores, Portugal', 'Africa & Atlantic']
  if (lat >= 27 && lat <= 30 && lon >= -19 && lon <= -13) return ['Canary Islands, Spain', 'Europe']
  // North Africa / Europe
  if (lat >= 27 && lat <= 36 && lon >= -14 && lon <= -1) return ['Morocco', 'Africa & Atlantic']
  if (lat >= 36 && lat <= 43 && lon >= -10 && lon <= -6) return ['Portugal', 'Europe']
  if (lat >= 43 && lat <= 51 && lon >= -8 && lon <= 3) return ['France', 'Europe']
  if (lat >= 35 && lat <= 44 && lon >= -4 && lon <= 5) return ['Spain', 'Europe']
  if (lat >= 49 && lat <= 62 && lon >= -12 && lon <= 3) return ['United Kingdom', 'Europe']
  // Sub-Saharan Africa
  if (lat >= -36 && lat <= -22 && lon >= 16 && lon <= 35) return ['South Africa', 'Africa & Atlantic']
  if (lat >= -30 && lat <= -15 && lon >= 11 && lon <= 19) return ['Namibia', 'Africa & Atlantic']
  // Indian Ocean islands
  if (lat >= -22 && lat <= -20 && lon >= 55 && lon <= 56) return ['Réunion', 'Indian Ocean']
  if (lat >= -1 && lat <= 8 && lon >= 72 && lon <= 75) return ['Maldives', 'Indian Ocean']
  // Southeast Asia
  if (lat >= -12 && lat <= 6 && lon >= 95 && lon <= 142) return ['Indonesia', 'Southeast Asia']
  if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 148) return ['Japan', 'Southeast Asia']
  // Oceania
  if (lat >= -44 && lat <= -10 && lon >= 140 && lon <= 155) return ['Australia', 'Oceania & Pacific']
  if (lat >= -36 && lat <= -20 && lon >= 112 && lon <= 130) return ['Western Australia', 'Oceania & Pacific']
  if (lat >= -48 && lat <= -34 && lon >= 165 && lon <= 180) return ['New Zealand', 'Oceania & Pacific']
  if (lat >= -22 && lat <= -14 && (lon >= 175 || lon <= -178)) return ['Fiji', 'Oceania & Pacific']
  if (lat >= -20 && lat <= -16 && lon >= -152 && lon <= -148) return ['French Polynesia', 'Oceania & Pacific']
  return ['', 'North America']
}

// ── Main export ──────────────────────────────────────────────────────────────

let _cache: DirectorySpot[] | null = null

export function getDirectorySpots(): DirectorySpot[] {
  if (_cache !== null) return _cache

  // ── Step 1: curated spots from surf-spots.ts ────────────────────────────
  const curated = getAllSpots().map(spot => {
    let minDist = Infinity
    let bestMatch: Top100Spot | null = null
    for (const t100 of TOP100) {
      const d = haversineKm(spot.lat, spot.lon, t100.lat, t100.lon)
      if (d < 5 && d < minDist) { minDist = d; bestMatch = t100 }
    }

    const entry: DirectorySpot = {
      name: spot.name,
      locality: spot.country,
      region: regionFromCountry(spot.country),
      lat: spot.lat,
      lon: spot.lon,
      slug: slugify(spot.name),
      href: `/spots/${slugify(spot.name)}`,
    }
    if (bestMatch !== null) {
      entry.waveType = bestMatch.waveType
      entry.difficulty = bestMatch.difficulty
      entry.bestSeason = bestMatch.bestSeason
      entry.wslBadge = bestMatch.wslBadge
      entry.top100Rank = bestMatch.rank
    }
    return entry
  })

  // ── Step 2: additional spots from notable-spots.json ────────────────────
  // Filter clean names (skip mojibake), derive locality+region from coords,
  // deduplicate against curated spots (3 km) and within themselves (1.5 km).

  const taken: { lat: number; lon: number }[] = curated.map(s => ({ lat: s.lat, lon: s.lon }))
  const extras: DirectorySpot[] = []

  for (const raw of notableRaw as { name: string; lat: number; lon: number }[]) {
    // Skip garbled names (mojibake common pattern: 'Ã' followed by a non-space)
    if (/Ã[^ ]/.test(raw.name) || raw.name.length < 3) continue

    // Skip if too close to any already-claimed spot
    const tooClose = taken.some(t => haversineKm(raw.lat, raw.lon, t.lat, t.lon) < 1.5)
    if (tooClose) continue

    const [locality, region] = localityAndRegion(raw.lat, raw.lon)
    if (!locality) continue  // unrecognised location

    taken.push({ lat: raw.lat, lon: raw.lon })
    extras.push({
      name: raw.name,
      locality,
      region,
      lat: raw.lat,
      lon: raw.lon,
      slug: slugify(raw.name),
      href: `/?lat=${raw.lat}&lon=${raw.lon}`,
    })
  }

  const result = [...curated, ...extras]
  _cache = result
  return result
}

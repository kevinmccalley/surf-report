import { getAllSpots, slugify } from './surf-spots'
import { SPOTS as TOP100 } from '../top100/spots-data'
import type { Top100Spot } from '../top100/spots-data'

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
  waveType?: WaveType
  difficulty?: Difficulty
  bestSeason?: string
  wslBadge?: 'CT Stop' | 'Big Wave'
  top100Rank?: number
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function regionFromCountry(country: string): Region {
  const c = country.toLowerCase()
  if (/\b(oahu|maui|kauai|molokai|hawaii)\b/.test(c)) return 'Hawaii'
  if (/, (ca|fl|nc|sc|ny|nj|ma|ct|me|va|ga)$/i.test(country)) return 'North America'
  if (/\b(california|florida|north carolina|south carolina|new york|new jersey|massachusetts|cocoa beach|montauk|manasquan|asbury park|nantucket|buxton|kill devil hills|folly beach)\b/.test(c)) return 'North America'
  if (/\b(puerto rico|rincón|rincon|mexico|baja|oaxaca|nayarit|colima|guerrero|michoacán|michoacan|guanacaste|puntarenas|dominical|la libertad|la unión|peru|chile|brazil|pernambuco|rio de janeiro|santa catarina|imbituba)\b/.test(c)) return 'Latin America'
  if (/tahiti|french polynesia/.test(c)) return 'Latin America'
  if (/réunion|reunion/.test(c)) return 'Indian Ocean'
  if (/\b(portugal|peniche|nazaré|nazare|ericeira|sagres|cascais|france|hossegor|biarritz|lacanau|anglet|spain|basque|galicia|lanzarote|canary|gran canaria|cornwall|devon|newquay|scotland|ireland|donegal|sligo|clare|north devon)\b/.test(c)) return 'Europe'
  if (/\buk\b/.test(c)) return 'Europe'
  if (/\b(morocco|taghazout|safi|south africa|jeffrey|durban|hout bay|george|western cape|namibia|walvis)\b/.test(c)) return 'Africa & Atlantic'
  if (/\b(maldives|malé|male|north mal|sri lanka|mauritius)\b/.test(c)) return 'Indian Ocean'
  if (/\b(bali|uluwatu|bukit|gianyar|canggu|java|lombok|mentawai|nias|indonesia|japan|chiba)\b/.test(c)) return 'Southeast Asia'
  if (/\b(australia|victoria|queensland|new south wales|tasmania|margaret river|yallingup|kalbarri|new zealand|waikato|auckland|fiji|tavarua|pacific harbour|namotu)\b/.test(c)) return 'Oceania & Pacific'
  if (/\bnsw\b/.test(c)) return 'Oceania & Pacific'
  return 'North America'
}

let _cache: DirectorySpot[] | null = null

export function getDirectorySpots(): DirectorySpot[] {
  if (_cache !== null) return _cache

  const result = getAllSpots().map(spot => {
    let minDist = Infinity
    let bestMatch: Top100Spot | null = null

    for (const t100 of TOP100) {
      const d = haversineKm(spot.lat, spot.lon, t100.lat, t100.lon)
      if (d < 5 && d < minDist) {
        minDist = d
        bestMatch = t100
      }
    }

    const entry: DirectorySpot = {
      name: spot.name,
      locality: spot.country,
      region: regionFromCountry(spot.country),
      lat: spot.lat,
      lon: spot.lon,
      slug: slugify(spot.name),
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

  _cache = result
  return result
}

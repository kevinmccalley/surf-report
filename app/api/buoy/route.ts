import { NextRequest, NextResponse } from 'next/server'
import type { BuoyReading } from '@/app/lib/types'
import { getDirectionLabel } from '@/app/lib/utils'

const STATIONS_URL = 'https://www.ndbc.noaa.gov/activestations.xml'
const REALTIME_URL = (id: string) =>
  `https://www.ndbc.noaa.gov/data/realtime2/${id.toUpperCase()}.txt`

const MAX_DISTANCE_KM = 300
const CANDIDATE_COUNT = 5

interface Station {
  id: string
  name: string
  lat: number
  lon: number
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseStations(xml: string): Station[] {
  const stations: Station[] = []
  // Match each self-closing <station ... /> element
  const stationRe = /<station\s([^>]+?)\/>/g
  const attrRe = /(\w+)="([^"]*)"/g
  let sm: RegExpExecArray | null
  while ((sm = stationRe.exec(xml)) !== null) {
    const attrs: Record<string, string> = {}
    attrRe.lastIndex = 0
    let am: RegExpExecArray | null
    while ((am = attrRe.exec(sm[1])) !== null) {
      attrs[am[1]] = am[2]
    }
    if (attrs.type !== 'buoy') continue
    const lat = parseFloat(attrs.lat)
    const lon = parseFloat(attrs.lon)
    if (isNaN(lat) || isNaN(lon)) continue
    stations.push({ id: attrs.id, name: attrs.name ?? attrs.id, lat, lon })
  }
  return stations
}

// NDBC realtime2 column indices (whitespace-split)
// YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP ...
//  0  1  2  3  4   5    6   7    8   9  10  11   12   13   14
function parseRealtimeText(
  text: string,
  station: Station,
  distKm: number,
): BuoyReading | null {
  const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim().length > 0)
  if (lines.length === 0) return null

  const parts = lines[0].trim().split(/\s+/)
  if (parts.length < 15) return null

  const num = (idx: number): number | null => {
    const v = parts[idx]
    if (!v || v.toUpperCase() === 'MM') return null
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }

  const wvht = num(8)
  if (wvht === null) return null  // no wave sensor on this buoy

  const yr = parts[0]
  const mo = parts[1].padStart(2, '0')
  const dy = parts[2].padStart(2, '0')
  const hr = parts[3].padStart(2, '0')
  const mn = parts[4].padStart(2, '0')
  const observedAt = `${yr}-${mo}-${dy}T${hr}:${mn}:00Z`

  const wspd = num(6)

  return {
    stationId: station.id,
    stationName: station.name,
    lat: station.lat,
    lon: station.lon,
    distanceKm: Math.round(distKm),
    waveHeight: wvht,
    wavePeriod: num(9),
    waveDirection: num(11),
    waterTemp: num(14),
    windSpeed: wspd !== null ? Math.round(wspd * 3.6) : null,  // m/s → km/h
    windDirection: num(5),
    airTemp: num(13),
    observedAt,
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  try {
    const stationsRes = await fetch(STATIONS_URL, { next: { revalidate: 3600 } })
    if (!stationsRes.ok) {
      return NextResponse.json({ error: 'Could not fetch NDBC station list' }, { status: 502 })
    }
    const xml = await stationsRes.text()
    const stations = parseStations(xml)

    // Find nearest buoy-type stations within range, sorted by distance
    const candidates = stations
      .map(s => ({ station: s, dist: haversineKm(lat, lon, s.lat, s.lon) }))
      .filter(({ dist }) => dist <= MAX_DISTANCE_KM)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, CANDIDATE_COUNT)

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No NDBC buoys within range' }, { status: 404 })
    }

    // Fetch realtime data for all candidates in parallel (5s timeout each)
    const results = await Promise.all(
      candidates.map(async ({ station, dist }) => {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 5000)
          const res = await fetch(REALTIME_URL(station.id), {
            signal: controller.signal,
            next: { revalidate: 1800 },
          })
          clearTimeout(timer)
          if (!res.ok) return null
          const text = await res.text()
          return parseRealtimeText(text, station, dist)
        } catch {
          return null
        }
      })
    )

    // Return nearest buoy that has wave data
    const reading = results.find(r => r !== null) ?? null
    if (!reading) {
      return NextResponse.json({ error: 'No wave data from nearby buoys' }, { status: 404 })
    }

    // Add direction label for convenience
    const withLabel = {
      ...reading,
      waveDirectionLabel: reading.waveDirection !== null
        ? getDirectionLabel(reading.waveDirection)
        : null,
      windDirectionLabel: reading.windDirection !== null
        ? getDirectionLabel(reading.windDirection)
        : null,
    }

    return NextResponse.json(withLabel, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (e) {
    console.error('[buoy] error:', e)
    return NextResponse.json({ error: 'Failed to fetch buoy data' }, { status: 500 })
  }
}

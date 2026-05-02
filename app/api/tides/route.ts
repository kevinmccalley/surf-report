import { NextRequest, NextResponse } from 'next/server'
import type { TideExtreme, TideHeight } from '@/app/lib/types'

interface NOAAStation {
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
  return R * 2 * Math.asin(Math.sqrt(a))
}

async function findNearestStation(lat: number, lon: number): Promise<{
  station: NOAAStation; distanceKm: number
} | null> {
  const url = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions'
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()

  const stations: NOAAStation[] = (data.stations ?? [])
    .map((s: { id: string; name: string; lat: string; lng: string }) => ({
      id: s.id,
      name: s.name,
      lat: parseFloat(s.lat),
      lon: parseFloat(s.lng),
    }))
    .filter((s: NOAAStation) => !isNaN(s.lat) && !isNaN(s.lon))

  if (!stations.length) return null

  let best = { station: stations[0], distanceKm: haversineKm(lat, lon, stations[0].lat, stations[0].lon) }
  for (const s of stations.slice(1)) {
    const d = haversineKm(lat, lon, s.lat, s.lon)
    if (d < best.distanceKm) best = { station: s, distanceKm: d }
  }
  return best
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ available: false, reason: 'no_coords' })
  }

  try {
    const nearest = await findNearestStation(lat, lon)

    if (!nearest) {
      return NextResponse.json({ available: false, reason: 'no_stations' })
    }

    const MAX_KM = 500
    if (nearest.distanceKm > MAX_KM) {
      return NextResponse.json({
        available: false,
        reason: 'out_of_range',
        nearestStationName: nearest.station.name,
        nearestStationDistanceKm: Math.round(nearest.distanceKm),
      })
    }

    const now = new Date()
    const end = new Date(now.getTime() + 10 * 86400 * 1000)
    const base =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${yyyymmdd(now)}&end_date=${yyyymmdd(end)}` +
      `&station=${nearest.station.id}` +
      `&product=predictions&datum=MLLW&time_zone=lst_ldt&units=metric&application=groundswell&format=json`

    const [hourlyRes, hiloRes] = await Promise.all([
      fetch(`${base}&interval=h`, { next: { revalidate: 21600 } }),
      fetch(`${base}&interval=hilo`, { next: { revalidate: 21600 } }),
    ])

    const [hourlyJson, hiloJson] = await Promise.all([hourlyRes.json(), hiloRes.json()])

    if (hourlyJson.error || hiloJson.error) {
      return NextResponse.json({
        available: false,
        reason: hourlyJson.error?.message ?? hiloJson.error?.message ?? 'noaa_error',
      })
    }

    const hourly: TideHeight[] = (hourlyJson.predictions ?? []).map(
      (p: { t: string; v: string }) => ({
        time: p.t,            // "YYYY-MM-DD HH:MM" local station time
        height: parseFloat(p.v),
      })
    )

    const extremes: TideExtreme[] = (hiloJson.predictions ?? []).map(
      (p: { t: string; v: string; type: string }) => ({
        time: p.t,
        height: parseFloat(p.v),
        type: p.type === 'H' ? 'High' : 'Low',
      })
    )

    return NextResponse.json({
      available: true,
      extremes,
      hourly,
      datum: 'MLLW',
      stationName: nearest.station.name,
      stationId: nearest.station.id,
      stationDistanceKm: Math.round(nearest.distanceKm),
    })
  } catch (e) {
    console.error('Tide API error:', e)
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import type { TideExtreme, TideHeight } from '@/app/lib/types'

// ── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function yyyymmdd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function toISOLocal(d: Date): string {
  return d.toISOString()
}

// ── NOAA ─────────────────────────────────────────────────────────────────────

interface NOAAStation { id: string; name: string; lat: number; lon: number }

async function tryNOAA(lat: number, lon: number): Promise<TideResult | null> {
  try {
    const stationsRes = await fetch(
      'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions',
      { next: { revalidate: 86400 } }
    )
    if (!stationsRes.ok) return null
    const stationsData = await stationsRes.json()

    const stations: NOAAStation[] = (stationsData.stations ?? [])
      .map((s: { id: string; name: string; lat: string; lng: string }) => ({
        id: s.id, name: s.name,
        lat: parseFloat(s.lat), lon: parseFloat(s.lng),
      }))
      .filter((s: NOAAStation) => !isNaN(s.lat) && !isNaN(s.lon))

    if (!stations.length) return null

    let best = { station: stations[0], distanceKm: haversineKm(lat, lon, stations[0].lat, stations[0].lon) }
    for (const s of stations.slice(1)) {
      const d = haversineKm(lat, lon, s.lat, s.lon)
      if (d < best.distanceKm) best = { station: s, distanceKm: d }
    }

    if (best.distanceKm > 500) {
      return {
        available: false,
        reason: 'out_of_range',
        nearestStationName: best.station.name,
        nearestStationDistanceKm: Math.round(best.distanceKm),
      }
    }

    const now = new Date()
    const end = new Date(now.getTime() + 10 * 86400 * 1000)
    const base =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${yyyymmdd(now)}&end_date=${yyyymmdd(end)}` +
      `&station=${best.station.id}` +
      `&product=predictions&datum=MLLW&time_zone=lst_ldt&units=metric&application=groundswell&format=json`

    const [hourlyRes, hiloRes] = await Promise.all([
      fetch(`${base}&interval=h`, { next: { revalidate: 21600 } }),
      fetch(`${base}&interval=hilo`, { next: { revalidate: 21600 } }),
    ])
    const [hourlyJson, hiloJson] = await Promise.all([hourlyRes.json(), hiloRes.json()])

    if (hourlyJson.error || hiloJson.error) return null

    const hourly: TideHeight[] = (hourlyJson.predictions ?? []).map(
      (p: { t: string; v: string }) => ({ time: p.t, height: parseFloat(p.v) })
    )
    const extremes: TideExtreme[] = (hiloJson.predictions ?? []).map(
      (p: { t: string; v: string; type: string }) => ({
        time: p.t, height: parseFloat(p.v), type: p.type === 'H' ? 'High' : 'Low',
      })
    )

    return {
      available: true,
      source: 'noaa',
      estimated: false,
      timeFormat: 'noaa-local',
      extremes,
      hourly,
      datum: 'MLLW',
      stationName: best.station.name,
      stationId: best.station.id,
      stationDistanceKm: Math.round(best.distanceKm),
    }
  } catch {
    return null
  }
}

// ── DFO (Canada) ─────────────────────────────────────────────────────────────

interface DFOStation { id: string; officialName: string; latitude: number; longitude: number }

async function tryDFO(lat: number, lon: number): Promise<TideResult | null> {
  try {
    const stationsRes = await fetch(
      'https://api-sine.dfo-mpo.gc.ca/api/v1/stations',
      { next: { revalidate: 86400 } }
    )
    if (!stationsRes.ok) return null
    const stationsData: DFOStation[] = await stationsRes.json()

    const stations = stationsData.filter(
      s => typeof s.latitude === 'number' && typeof s.longitude === 'number'
    )
    if (!stations.length) return null

    let best = { station: stations[0], distanceKm: haversineKm(lat, lon, stations[0].latitude, stations[0].longitude) }
    for (const s of stations.slice(1)) {
      const d = haversineKm(lat, lon, s.latitude, s.longitude)
      if (d < best.distanceKm) best = { station: s, distanceKm: d }
    }

    if (best.distanceKm > 400) return null

    const now = new Date()
    const end = new Date(now.getTime() + 10 * 86400 * 1000)
    const from = toISOLocal(now)
    const to = toISOLocal(end)
    const stationId = best.station.id

    const [hourlyRes, hiloRes] = await Promise.all([
      fetch(
        `https://api-sine.dfo-mpo.gc.ca/api/v1/stations/${stationId}/data?time-series-code=wlp&from=${from}&to=${to}`,
        { next: { revalidate: 21600 } }
      ),
      fetch(
        `https://api-sine.dfo-mpo.gc.ca/api/v1/stations/${stationId}/data?time-series-code=wlp-hilo&from=${from}&to=${to}`,
        { next: { revalidate: 21600 } }
      ),
    ])

    if (!hourlyRes.ok || !hiloRes.ok) return null
    const [hourlyData, hiloData] = await Promise.all([hourlyRes.json(), hiloRes.json()])

    const hourly: TideHeight[] = (Array.isArray(hourlyData) ? hourlyData : []).map(
      (p: { eventDate: string; value: string | number }) => ({
        time: p.eventDate,
        height: typeof p.value === 'string' ? parseFloat(p.value) : p.value,
      })
    ).filter((h: TideHeight) => !isNaN(h.height))

    const extremes: TideExtreme[] = (Array.isArray(hiloData) ? hiloData : []).map(
      (p: { eventDate: string; value: string | number; type?: string }): TideExtreme => {
        const height = typeof p.value === 'string' ? parseFloat(p.value) : p.value
        const type: 'High' | 'Low' = (p.type === 'H' || p.type === 'High') ? 'High' : 'Low'
        return { time: p.eventDate, height, type }
      }
    ).filter((e: TideExtreme) => !isNaN(e.height))

    if (!hourly.length) return null

    // If DFO hilo is missing type info, infer H/L from alternating pattern
    inferHiLo(extremes)

    return {
      available: true,
      source: 'dfo',
      estimated: false,
      timeFormat: 'iso-utc',
      extremes,
      hourly,
      datum: 'CD',
      stationName: best.station.officialName,
      stationId: best.station.id,
      stationDistanceKm: Math.round(best.distanceKm),
    }
  } catch {
    return null
  }
}

// If all extremes have the same type label it means DFO didn't include type;
// infer by comparing each extreme height to its neighbours
function inferHiLo(extremes: TideExtreme[]) {
  const allSame = extremes.every(e => e.type === extremes[0]?.type)
  if (!allSame || !extremes.length) return
  for (let i = 0; i < extremes.length; i++) {
    const prev = extremes[i - 1]?.height ?? extremes[i].height
    const next = extremes[i + 1]?.height ?? extremes[i].height
    extremes[i].type = extremes[i].height >= prev && extremes[i].height >= next ? 'High' : 'Low'
  }
}

// ── WorldTides (global harmonic fallback) ─────────────────────────────────────

async function tryWorldTides(lat: number, lon: number): Promise<TideResult | null> {
  const key = process.env.WORLDTIDES_API_KEY
  if (!key) return null
  try {
    const url =
      `https://www.worldtides.info/api/v2?extremes&heights` +
      `&lat=${lat}&lon=${lon}&days=5&step=3600&key=${key}`
    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return null
    const data = await res.json() as {
      status: number
      station?: string
      responseLat?: number
      responseLon?: number
      heights?: { date: string; height: number }[]
      extremes?: { date: string; height: number; type: string }[]
    }

    // Non-200 status means rate-limited, invalid key, or no coverage
    if (data.status !== 200) {
      console.warn(`[WorldTides] status ${data.status} — falling back to Open-Meteo`)
      return null
    }

    const hourly: TideHeight[] = (data.heights ?? [])
      .map(h => ({ time: h.date, height: h.height }))
      .filter(h => !isNaN(h.height))

    const extremes: TideExtreme[] = (data.extremes ?? [])
      .map((e): TideExtreme => ({
        time:   e.date,
        height: e.height,
        type:   e.type === 'High' ? 'High' : 'Low',
      }))
      .filter(e => !isNaN(e.height))

    if (!hourly.length) return null

    const stationDistanceKm =
      data.responseLat != null && data.responseLon != null
        ? Math.round(haversineKm(lat, lon, data.responseLat, data.responseLon))
        : undefined

    return {
      available: true,
      source: 'worldtides',
      estimated: false,
      timeFormat: 'iso-utc',
      extremes,
      hourly,
      datum: 'LAT',
      stationName: data.station ?? undefined,
      stationDistanceKm,
    }
  } catch {
    return null
  }
}

// ── Parabolic interpolation for peak/valley time + height ────────────────────
// Fits a parabola through three equally-spaced hourly points to find the
// sub-hour position of the true tide extreme.

function addMinutes(timeStr: string, minutes: number): string {
  const norm = timeStr.replace('T', ' ').replace(/Z$/, '').slice(0, 16)
  const [datePart, timePart] = norm.split(' ')
  const [yr, mo, dy] = datePart.split('-').map(Number)
  const [hr, mi] = timePart.split(':').map(Number)
  const d = new Date(yr, mo - 1, dy, hr, mi + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function interpolateExtreme(
  times: string[], heights: number[], i: number
): { time: string; height: number } {
  const y0 = heights[i - 1], y1 = heights[i], y2 = heights[i + 1]
  const denom = y0 - 2 * y1 + y2
  if (Math.abs(denom) < 1e-6) return { time: times[i], height: y1 }
  // offset is fractional hours from point i (typically −0.5 to +0.5)
  const offset = (y0 - y2) / (2 * denom)
  const peakH  = y1 - (y0 - y2) ** 2 / (8 * denom)
  // Use floor/ceil instead of round so we never land on :00 when there is a
  // genuine offset — if offset > 0 the peak is after the hour, if < 0 before.
  const offsetMin = offset >= 0
    ? Math.floor(offset * 60)
    : Math.ceil(offset * 60)
  return {
    time:   addMinutes(times[i], offsetMin),
    height: peakH,
  }
}

// ── Open-Meteo (global fallback) ──────────────────────────────────────────────

async function tryOpenMeteo(lat: number, lon: number): Promise<TideResult | null> {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=sea_level_height_msl&forecast_days=10&timezone=auto`

    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return null
    const data = await res.json()

    const times: string[] = data.hourly?.time ?? []
    const heights: number[] = data.hourly?.sea_level_height_msl ?? []

    if (!times.length || !heights.length) return null

    const hourly: TideHeight[] = times.map((t, i) => ({
      time: t,
      height: heights[i] ?? 0,
    })).filter(h => !isNaN(h.height))

    // Detect local minima/maxima; use parabolic interpolation for sub-hour accuracy.
    // Use htimes/hts from the filtered hourly array so indices stay aligned.
    const htimes = hourly.map(h => h.time)
    const hts    = hourly.map(h => h.height)
    const extremes: TideExtreme[] = []
    for (let i = 1; i < hourly.length - 1; i++) {
      const prev = hts[i - 1], cur = hts[i], next = hts[i + 1]
      if (cur >= prev && cur >= next && cur > prev + 0.05) {
        const interp = interpolateExtreme(htimes, hts, i)
        extremes.push({ time: interp.time, height: interp.height, type: 'High' })
      } else if (cur <= prev && cur <= next && cur < prev - 0.05) {
        const interp = interpolateExtreme(htimes, hts, i)
        extremes.push({ time: interp.time, height: interp.height, type: 'Low' })
      }
    }

    return {
      available: true,
      source: 'open-meteo',
      estimated: true,
      timeFormat: 'iso-local',
      extremes,
      hourly,
      datum: 'MSL',
    }
  } catch {
    return null
  }
}

// ── Response type union ───────────────────────────────────────────────────────

type TideResult =
  | {
      available: true
      source: 'noaa' | 'dfo' | 'worldtides' | 'open-meteo'
      estimated: boolean
      timeFormat: 'noaa-local' | 'iso-utc' | 'iso-local'
      extremes: TideExtreme[]
      hourly: TideHeight[]
      datum: string
      stationName?: string
      stationId?: string
      stationDistanceKm?: number
    }
  | {
      available: false
      reason: string
      nearestStationName?: string
      nearestStationDistanceKm?: number
    }

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ available: false, reason: 'no_coords' })
  }

  try {
    // Try NOAA and DFO in parallel; use the first that succeeds with data
    const [noaaResult, dfoResult] = await Promise.all([
      tryNOAA(lat, lon),
      tryDFO(lat, lon),
    ])

    // Prefer harmonic sources: NOAA → DFO → WorldTides → Open-Meteo (estimated)
    if (noaaResult?.available) return NextResponse.json(noaaResult)
    if (dfoResult?.available) return NextResponse.json(dfoResult)

    // Global harmonic: WorldTides (falls back automatically if rate-limited)
    const wtResult = await tryWorldTides(lat, lon)
    if (wtResult?.available) return NextResponse.json(wtResult)

    // Last resort: Open-Meteo sea level model (estimated)
    const omResult = await tryOpenMeteo(lat, lon)
    if (omResult?.available) return NextResponse.json(omResult)

    // All sources failed — return a useful error
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  } catch (e) {
    console.error('Tide API error:', e)
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  }
}

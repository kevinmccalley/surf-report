import { NextRequest, NextResponse } from 'next/server'
import type { NearbySpot } from '@/app/lib/types'
import { computeSurfRating } from '@/app/lib/surf-rating'
import { getDirectionLabel, findCurrentHourIndex, estimateWaterTemp } from '@/app/lib/utils'

interface RawSpot { name: string; lat: number; lon: number; source: 'osm' | 'wikidata' }

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Primary source: OpenStreetMap Overpass ─────────────────────────────────────
async function fetchOverpassSpots(lat: number, lon: number, radiusM: number): Promise<RawSpot[]> {
  const query =
    `[out:json][timeout:20];` +
    `(node["sport"="surfing"](around:${radiusM},${lat},${lon});` +
    `way["sport"="surfing"](around:${radiusM},${lat},${lon}););` +
    `out center body;`
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(22000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const spots: RawSpot[] = []
    for (const el of (data.elements ?? [])) {
      const name: string = el.tags?.name ?? el.tags?.['name:en'] ?? ''
      if (!name) continue
      const elLat: number | undefined = el.type === 'node' ? el.lat : el.center?.lat
      const elLon: number | undefined = el.type === 'node' ? el.lon : el.center?.lon
      if (elLat == null || elLon == null) continue
      spots.push({ name, lat: elLat, lon: elLon, source: 'osm' })
    }
    return spots
  } catch {
    return []
  }
}

// ── Supplementary source: Wikidata surf breaks (Q693906) ──────────────────────
// Covers many globally-known spots not yet mapped in OSM, particularly in
// Central America, West Africa, Indonesia and lesser-mapped coastlines.
async function fetchWikidataSpots(lat: number, lon: number): Promise<RawSpot[]> {
  const pad = 0.9  // ~100 km
  const sparql = `
    SELECT ?item ?itemLabel ?lat ?lon WHERE {
      ?item wdt:P31 wd:Q693906.
      ?item p:P625/psv:P625 [wikibase:geoLatitude ?lat; wikibase:geoLongitude ?lon].
      FILTER(?lat > ${lat - pad} && ?lat < ${lat + pad} && ?lon > ${lon - pad} && ?lon < ${lon + pad})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 40`
  try {
    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
      {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'Groundswell/1.0 (surf-report)',
        },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results?.bindings ?? [])
      .filter((b: Record<string, { value: string }>) =>
        b.itemLabel?.value && !b.itemLabel.value.startsWith('Q'))
      .map((b: Record<string, { value: string }>) => ({
        name: b.itemLabel.value,
        lat: parseFloat(b.lat.value),
        lon: parseFloat(b.lon.value),
        source: 'wikidata' as const,
      }))
  } catch {
    return []
  }
}

// ── Dedup by proximity (prefer OSM names) ─────────────────────────────────────
function deduplicate(spots: RawSpot[]): RawSpot[] {
  const kept: RawSpot[] = []
  for (const s of spots) {
    const idx = kept.findIndex(k => haversineKm(s.lat, s.lon, k.lat, k.lon) < 2.0)
    if (idx === -1) {
      kept.push(s)
    } else if (s.source === 'osm' && kept[idx].source !== 'osm') {
      kept[idx] = s
    }
  }
  return kept
}

// ── Lightweight current-conditions fetch per spot ─────────────────────────────
function val(arr: unknown[] | undefined, i: number, fallback = 0): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

async function fetchSpotConditions(
  spot: RawSpot,
  originLat: number,
  originLon: number,
): Promise<NearbySpot | null> {
  const base = `latitude=${spot.lat}&longitude=${spot.lon}`
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?${base}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature` +
    `&timezone=auto&forecast_hours=4`
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?${base}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
    `&timezone=auto&forecast_hours=4&wind_speed_unit=kmh`
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, { next: { revalidate: 1800 } }),
      fetch(weatherUrl, { next: { revalidate: 1800 } }),
    ])
    const [marine, weather] = await Promise.all([marineRes.json(), weatherRes.json()])
    if (marine.error) return null  // inland coordinate — skip

    const utcOffset = (marine.utc_offset_seconds ?? weather.utc_offset_seconds) ?? 0
    const idx = findCurrentHourIndex(weather.hourly.time as string[], utcOffset)
    const mh = marine.hourly as Record<string, unknown[]>
    const wh = weather.hourly as Record<string, unknown[]>

    const waveHeight   = val(mh.wave_height, idx)
    const wavePeriod   = val(mh.wave_period, idx)
    const swellHeight  = val(mh.swell_wave_height, idx)
    const swellPeriod  = val(mh.swell_wave_period, idx)
    const swellDir     = val(mh.swell_wave_direction, idx)
    const windSpeed    = val(wh.wind_speed_10m, idx)
    const windDir      = val(wh.wind_direction_10m, idx)
    const airTemp      = val(wh.temperature_2m, idx)
    const weatherCode  = val(wh.weather_code, idx)
    const waterTempRaw = mh.sea_surface_temperature?.[idx]
    const waterTemp =
      typeof waterTempRaw === 'number' && !isNaN(waterTempRaw) && waterTempRaw > -50
        ? waterTempRaw
        : estimateWaterTemp(spot.lat, new Date().getMonth())

    return {
      name:                spot.name,
      lat:                 spot.lat,
      lon:                 spot.lon,
      distanceKm:          Math.round(haversineKm(originLat, originLon, spot.lat, spot.lon)),
      waveHeight,
      wavePeriod,
      swellDirection:      swellDir,
      swellDirectionLabel: getDirectionLabel(swellDir),
      windSpeed,
      windDirection:       windDir,
      windDirectionLabel:  getDirectionLabel(windDir),
      waterTemp,
      airTemp,
      weatherCode,
      rating:              computeSurfRating(waveHeight, wavePeriod, swellHeight, swellPeriod, windSpeed),
    }
  } catch {
    return null
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const sp  = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')
  if (isNaN(lat) || isNaN(lon))
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })

  const [osmResult, wdResult] = await Promise.allSettled([
    fetchOverpassSpots(lat, lon, 80000),
    fetchWikidataSpots(lat, lon),
  ])

  const raw: RawSpot[] = [
    ...(osmResult.status === 'fulfilled' ? osmResult.value : []),
    ...(wdResult.status  === 'fulfilled' ? wdResult.value  : []),
  ]

  const sorted = raw
    .filter(s => haversineKm(lat, lon, s.lat, s.lon) > 0.3)
    .sort((a, b) => haversineKm(lat, lon, a.lat, a.lon) - haversineKm(lat, lon, b.lat, b.lon))

  const unique = deduplicate(sorted).slice(0, 10)

  const results = await Promise.all(unique.map(s => fetchSpotConditions(s, lat, lon)))
  const spots   = results.filter((s): s is NearbySpot => s !== null)

  return NextResponse.json(spots, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
  })
}

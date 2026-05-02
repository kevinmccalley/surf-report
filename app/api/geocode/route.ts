import { NextRequest, NextResponse } from 'next/server'
import type { GeoResult } from '@/app/lib/types'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SurfReport/1.0 (surf-report-app)' },
      next: { revalidate: 86400 },
    })

    if (!res.ok) throw new Error('Geocoding request failed')

    const data = await res.json()

    const results: GeoResult[] = data.map((item: {
      lat: string
      lon: string
      address?: {
        city?: string
        town?: string
        village?: string
        hamlet?: string
        suburb?: string
        municipality?: string
        county?: string
        state?: string
        country?: string
        country_code?: string
      }
      display_name?: string
    }) => {
      const addr = item.address ?? {}
      const place = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb ?? addr.municipality ?? addr.county ?? 'Unknown'
      const state = addr.state ?? ''
      const country = addr.country ?? ''

      return {
        name: place,
        country,
        state,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: item.display_name ?? `${place}, ${country}`,
      }
    }).filter((r: GeoResult) => !isNaN(r.lat) && !isNaN(r.lon))

    // Deduplicate by approximate lat/lon
    const seen = new Set<string>()
    const unique = results.filter((r: GeoResult) => {
      const key = `${r.lat.toFixed(2)},${r.lon.toFixed(2)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ results: unique.slice(0, 5) })
  } catch (e) {
    console.error('Geocode error:', e)
    return NextResponse.json({ results: [] })
  }
}

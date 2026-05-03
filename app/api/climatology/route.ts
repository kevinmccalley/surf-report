import { NextRequest, NextResponse } from 'next/server'
import { getClimatologyData } from '@/app/lib/climatology'

export type { ClimatologyMonth } from '@/app/lib/climatology'

export async function GET(request: NextRequest) {
  const sp  = request.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lon = parseFloat(sp.get('lon') ?? '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const latR = Math.round(lat * 2) / 2
  const lonR = Math.round(lon * 2) / 2

  try {
    const months = await getClimatologyData(latR, lonR)

    if (months.every(m => m.sampleSize === 0)) {
      return NextResponse.json({ available: false, reason: 'no_marine_data' })
    }

    const sorted     = [...months].sort((a, b) => b.score - a.score)
    const peakMonths = sorted.slice(0, 2).map(m => m.month).sort((a, b) => a - b)

    return NextResponse.json(
      { available: true, months, peakMonths, yearsUsed: [2022, 2023, 2024], lat: latR, lon: lonR },
      { headers: { 'Cache-Control': 's-maxage=604800, stale-while-revalidate=86400' } }
    )
  } catch {
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  }
}

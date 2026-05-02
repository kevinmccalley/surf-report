import { NextRequest, NextResponse } from 'next/server'
import type { TideExtreme, TideHeight } from '@/app/lib/types'

const WORLDTIDES_KEY = process.env.WORLDTIDES_API_KEY

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = sp.get('lat')
  const lon = sp.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ available: false, reason: 'no_coords' })
  }

  if (!WORLDTIDES_KEY) {
    return NextResponse.json({ available: false, reason: 'no_key' })
  }

  const now = Math.floor(Date.now() / 1000)
  const tenDays = 60 * 60 * 24 * 10  // 10 days in seconds

  try {
    const url =
      `https://www.worldtides.info/api/v3` +
      `?heights&extremes` +
      `&lat=${lat}&lng=${lon}` +
      `&start=${now}&length=${tenDays}&step=3600` +
      `&datum=LAT` +
      `&key=${WORLDTIDES_KEY}`

    const res = await fetch(url, { next: { revalidate: 21600 } })  // cache 6h
    const data = await res.json()

    if (data.error || data.status === 400 || data.status === 403) {
      return NextResponse.json({
        available: false,
        reason: data.error ?? `WorldTides error ${data.status}`,
      })
    }

    const extremes: TideExtreme[] = (data.extremes ?? []).map((e: {
      date: string; height: number; type: string
    }) => ({
      time: e.date,
      height: e.height,
      type: e.type as 'High' | 'Low',
    }))

    const hourly: TideHeight[] = (data.heights ?? []).map((h: {
      date: string; height: number
    }) => ({
      time: h.date,
      height: h.height,
    }))

    return NextResponse.json({ available: true, extremes, hourly, datum: 'LAT' })
  } catch (e) {
    console.error('Tide API error:', e)
    return NextResponse.json({ available: false, reason: 'fetch_error' })
  }
}

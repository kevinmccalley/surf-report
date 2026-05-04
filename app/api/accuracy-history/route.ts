import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'

export interface DailyAccuracyRecord {
  date: string
  timestamp: string
  overallPct: number
  totalMatches: number
  avgError: number
  stationsChecked: number
  stationsPassing: number
  stations: {
    name: string
    stateAbbr: string
    pctWithin30: number
    meanAbsError: number
    error?: string
  }[]
  waveAvgPctError: number
  wavesChecked: number
  wavesPassing: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '365'), 365)

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ records: [], available: 0, kvConfigured: false })
  }

  try {
    const today = new Date()
    const keys = Array.from({ length: days }, (_, i) => {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i)
      return `accuracy:${d.toISOString().slice(0, 10)}`
    })

    const raw = await kv.mget<DailyAccuracyRecord[]>(...keys)
    const records = raw
      .filter((r): r is DailyAccuracyRecord => r !== null && r !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(
      { records, available: records.length, kvConfigured: true },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch (err) {
    console.error('[accuracy-history] KV error:', err)
    return NextResponse.json({ records: [], available: 0, kvConfigured: true, error: 'KV read failed' })
  }
}

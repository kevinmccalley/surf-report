import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import type { EpicNowData } from '@/app/api/cron/epic-now/route'

export async function GET() {
  try {
    const data = await kv.get<EpicNowData>('epic-now')
    if (!data) return NextResponse.json({ spots: [], updatedAt: null, checkedCount: 0 })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    })
  } catch {
    return NextResponse.json({ spots: [], updatedAt: null, checkedCount: 0 })
  }
}

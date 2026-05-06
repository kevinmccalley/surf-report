import { NextResponse } from 'next/server'
import { rget } from '@/app/lib/redis'
import type { EpicNowData } from '@/app/api/cron/epic-now/route'

export async function GET() {
  const data = await rget<EpicNowData>('epic-now')
  if (!data) return NextResponse.json({ spots: [], updatedAt: null, checkedCount: 0 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  })
}

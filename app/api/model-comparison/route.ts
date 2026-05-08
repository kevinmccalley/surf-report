import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionTier } from '@/app/lib/subscription'
import { getDirectionLabel, getDayName, omUrl } from '@/app/lib/utils'
import type { ModelComparisonData, ModelComparisonDay } from '@/app/lib/types'

function val(arr: unknown[] | undefined, i: number): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : 0
}

function agreement(a: number, b: number): 'high' | 'medium' | 'low' {
  const diff = Math.abs(a - b)
  const avg = (a + b) / 2
  const pct = avg > 0.1 ? diff / avg : 0
  if (diff < 0.3 || pct < 0.2) return 'high'
  if (diff < 0.7 || pct < 0.4) return 'medium'
  return 'low'
}

const DAILY = 'wave_height_max,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max,wave_direction_dominant'

export async function GET(req: NextRequest) {
  const tier = await getSubscriptionTier()
  if (tier !== 'premium') {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const lat = sp.get('lat')
  const lon = sp.get('lon')
  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })

  const base = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&daily=${DAILY}&timezone=auto&forecast_days=10`
  const cmemsUrl = base
  const gfsUrl   = `${base}&models=ecmwf_wam`

  try {
    const [cmemsRes, gfsRes] = await Promise.all([
      fetch(omUrl(cmemsUrl), { next: { revalidate: 3600 } }),
      fetch(omUrl(gfsUrl),   { next: { revalidate: 3600 } }),
    ])

    const [cmems, gfs] = await Promise.all([cmemsRes.json(), gfsRes.json()])

    if (cmems.error || !cmems.daily) {
      return NextResponse.json({ available: false, days: [] } satisfies ModelComparisonData)
    }

    const cd = cmems.daily as Record<string, unknown[]>
    const gd = (gfs.error || !gfs.daily ? cd : gfs.daily) as Record<string, unknown[]>
    const gfsAvailable = !gfs.error && !!gfs.daily

    const dates = (cd.time ?? []) as string[]

    const days: ModelComparisonDay[] = dates.slice(0, 10).map((date, i) => {
      const cWave = val(cd.wave_height_max, i)
      const gWave = gfsAvailable ? val(gd.wave_height_max, i) : cWave
      return {
        date,
        dayName: getDayName(date, i),
        cmems: {
          waveHeight: cWave,
          wavePeriod: val(cd.wave_period_max, i),
          swellDir:   val(cd.swell_wave_direction_dominant, i),
          swellDirLabel: getDirectionLabel(val(cd.swell_wave_direction_dominant, i)),
        },
        gfs: {
          waveHeight: gWave,
          wavePeriod: gfsAvailable ? val(gd.wave_period_max, i) : val(cd.wave_period_max, i),
          swellDir:   gfsAvailable ? val(gd.swell_wave_direction_dominant, i) : val(cd.swell_wave_direction_dominant, i),
          swellDirLabel: getDirectionLabel(gfsAvailable ? val(gd.swell_wave_direction_dominant, i) : val(cd.swell_wave_direction_dominant, i)),
        },
        agreement: gfsAvailable ? agreement(cWave, gWave) : 'high',
      }
    })

    return NextResponse.json({ available: true, days } satisfies ModelComparisonData)
  } catch (e) {
    console.error('[model-comparison]', e)
    return NextResponse.json({ available: false, days: [] } satisfies ModelComparisonData)
  }
}

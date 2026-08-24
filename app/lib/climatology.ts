import { unstable_cache } from 'next/cache'

const DIR_LABELS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

export function directionLabel(deg: number): string {
  return DIR_LABELS[Math.round(deg / 22.5) % 16]
}

export function circularMean(angles: number[]): number {
  if (!angles.length) return 0
  const sin = angles.reduce((s, a) => s + Math.sin(a * Math.PI / 180), 0)
  const cos = angles.reduce((s, a) => s + Math.cos(a * Math.PI / 180), 0)
  return (Math.atan2(sin, cos) * 180 / Math.PI + 360) % 360
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export interface ClimatologyMonth {
  month: number
  name: string
  avgHs: number
  avgPeriod: number
  avgSwellHeight: number
  avgSwellPeriod: number
  avgSwellDirection: number
  dominantDirectionLabel: string
  sampleSize: number
  score: number
}

export interface ClimatologyResult {
  available: true
  months: ClimatologyMonth[]
  peakMonths: number[]
  yearsUsed: number[]
  lat: number
  lon: number
}

async function fetchMarineYear(lat: number, lon: number, year: number) {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction` +
    `&start_date=${year}-01-01&end_date=${year}-12-31`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const d = await res.json()
    const h = d.hourly ?? {}
    return {
      times:       (h.time                 ?? []) as string[],
      waveHeight:  (h.wave_height          ?? []) as (number | null)[],
      wavePeriod:  (h.wave_period          ?? []) as (number | null)[],
      swellHeight: (h.swell_wave_height    ?? []) as (number | null)[],
      swellPeriod: (h.swell_wave_period    ?? []) as (number | null)[],
      swellDir:    (h.swell_wave_direction ?? []) as (number | null)[],
    }
  } catch { return null }
}

export async function computeClimatology(lat: number, lon: number): Promise<ClimatologyMonth[]> {
  const years = [2022, 2023, 2024]
  type Acc = { hs: number[]; period: number[]; sh: number[]; sp: number[]; sd: number[] }
  const monthly: Record<number, Acc> = {}
  for (let m = 1; m <= 12; m++) monthly[m] = { hs: [], period: [], sh: [], sp: [], sd: [] }

  const results = await Promise.all(years.map(y => fetchMarineYear(lat, lon, y)))

  for (const r of results) {
    if (!r) continue
    for (let i = 0; i < r.times.length; i++) {
      const m = parseInt(r.times[i].slice(5, 7))
      const acc = monthly[m]
      if (r.waveHeight[i]  != null) acc.hs.push(r.waveHeight[i]!)
      if (r.wavePeriod[i]  != null) acc.period.push(r.wavePeriod[i]!)
      if (r.swellHeight[i] != null) acc.sh.push(r.swellHeight[i]!)
      if (r.swellPeriod[i] != null) acc.sp.push(r.swellPeriod[i]!)
      if (r.swellDir[i]    != null) acc.sd.push(r.swellDir[i]!)
    }
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const m   = idx + 1
    const acc = monthly[m]
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    const avgHs          = avg(acc.hs)
    const avgSwellPeriod = avg(acc.sp)
    const avgSwellDir    = circularMean(acc.sd)
    const score          = Math.min(avgHs, 3.0) * 2 + Math.min(avgSwellPeriod, 14) * 0.3

    return {
      month:                  m,
      name:                   MONTH_NAMES[idx],
      avgHs:                  Math.round(avgHs * 100) / 100,
      avgPeriod:              Math.round(avg(acc.period) * 10) / 10,
      avgSwellHeight:         Math.round(avg(acc.sh) * 100) / 100,
      avgSwellPeriod:         Math.round(avgSwellPeriod * 10) / 10,
      avgSwellDirection:      Math.round(avgSwellDir),
      dominantDirectionLabel: directionLabel(avgSwellDir),
      sampleSize:             acc.hs.length,
      score:                  Math.round(score * 100) / 100,
    }
  })
}

async function probeOceanPoint(lat: number, lon: number): Promise<boolean> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}&hourly=wave_height&start_date=2024-06-01&end_date=2024-06-01`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return false
    const d = await res.json()
    const values: (number | null)[] = d?.hourly?.wave_height ?? []
    return values.some(v => v != null)
  } catch {
    return false
  }
}

// The marine API grid is coarse enough that rounding a coastal spot's coordinates
// (see the 0.5° rounding callers do before calling getClimatologyData) can snap
// onto a land cell, even though the spot itself is a real break on open water.
// Search outward in 0.25° rings for the nearest cell that actually has wave data.
async function resolveOceanPoint(lat: number, lon: number): Promise<{ lat: number; lon: number } | null> {
  const STEP = 0.25
  const MAX_RING = 6 // up to 1.5° out (~165km)

  if (await probeOceanPoint(lat, lon)) return { lat, lon }

  for (let ring = 1; ring <= MAX_RING; ring++) {
    const candidates: { lat: number; lon: number }[] = []
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue // only the new outer ring
        candidates.push({ lat: lat + i * STEP, lon: lon + j * STEP })
      }
    }
    const hits = (
      await Promise.all(candidates.map(async c => ((await probeOceanPoint(c.lat, c.lon)) ? c : null)))
    ).filter((c): c is { lat: number; lon: number } => c !== null)

    if (hits.length) {
      hits.sort((a, b) => Math.hypot(a.lat - lat, a.lon - lon) - Math.hypot(b.lat - lat, b.lon - lon))
      return hits[0]
    }
  }
  return null
}

export function getClimatologyData(latR: number, lonR: number) {
  return unstable_cache(
    async () => {
      const point = await resolveOceanPoint(latR, lonR)
      if (!point) return []
      return computeClimatology(point.lat, point.lon)
    },
    [`climatology-${latR}-${lonR}`],
    { revalidate: 60 * 60 * 24 * 7 }
  )()
}

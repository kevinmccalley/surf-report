import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type {
  SurfReport, CurrentConditions, HourlyForecast, DayForecast, SwellInfo
} from '@/app/lib/types'
import { computeSurfRating } from '@/app/lib/surf-rating'
import { findCalibration, applyCalibration } from '@/app/lib/spot-calibration'
import {
  getDirectionLabel, getWeatherDescription,
  findCurrentHourIndex, estimateWaterTemp, getDayName, omUrl
} from '@/app/lib/utils'
import { getSubscriptionTier } from '@/app/lib/subscription'

const FREE_FORECAST_DAYS = 3
const PREMIUM_FORECAST_DAYS = 15

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = sp.get('lat')
  const lon = sp.get('lon')
  const name = sp.get('name') ?? 'Unknown Location'
  const country = sp.get('country') ?? ''

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const serverTier = await getSubscriptionTier()
  // If server auth failed (public route, Clerk dev rate limit, etc.) fall back to
  // the tier the client reported from its own page-render (already validated by Clerk).
  const clientTier = sp.get('tier') as string | null
  const tier = serverTier !== 'free'
    ? serverTier
    : clientTier === 'premium' || clientTier === 'individual' ? clientTier : 'free'
  const forecastDays = tier === 'premium' ? PREMIUM_FORECAST_DAYS : tier === 'individual' ? 10 : FREE_FORECAST_DAYS

  const apiForecastDays = Math.min(forecastDays, 16)
  // Fetch extended marine data for any tier that needs more than NEMO's ~8-day range
  const isPremiumExtended = forecastDays > 8

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature` +
    `&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max` +
    `&timezone=auto&forecast_days=${apiForecastDays}`

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,precipitation_probability,visibility` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=${apiForecastDays}&wind_speed_unit=kmh`

  try {
    const gfsMarineUrl =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
      `&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max` +
      `&timezone=auto&forecast_days=${apiForecastDays}&models=ecmwf_wam`

    const [marineRes, weatherRes, gfsMarineRes] = await Promise.all([
      fetch(omUrl(marineUrl), { next: { revalidate: 1800 } }),
      fetch(omUrl(weatherUrl), { next: { revalidate: 1800 } }),
      isPremiumExtended ? fetch(omUrl(gfsMarineUrl), { next: { revalidate: 1800 } }) : Promise.resolve(null),
    ])

    const [marine, weather, gfsMarineRaw] = await Promise.all([
      marineRes.json(),
      weatherRes.json(),
      gfsMarineRes ? gfsMarineRes.json() : Promise.resolve(null),
    ])

    // If the primary marine model has no valid wave heights (land-mask or model gap),
    // fetch the best_match model as a fallback — unless we already have it from above.
    const nemoHasWaves = !marine.error &&
      ((marine.hourly as Record<string, unknown[]>)?.wave_height ?? [])
        .some(v => typeof v === 'number' && !isNaN(v))
    let gfsFallbackRaw: Record<string, unknown> | null = null
    if (!nemoHasWaves && !gfsMarineRaw) {
      const r = await fetch(omUrl(gfsMarineUrl), { next: { revalidate: 1800 } }).catch(() => null)
      gfsFallbackRaw = r ? await r.json().catch(() => null) : null
    }
    const gfsMarine = (() => {
      const raw = gfsMarineRaw ?? gfsFallbackRaw
      return raw && !(raw as Record<string, unknown>).error ? raw : null
    })()

    // When NEMO is land-masked, promote the ECMWF fallback to primary so all
    // val() calls in buildReport read real wave data instead of zeros.
    const effectiveMarine = (!nemoHasWaves && gfsMarine) ? gfsMarine : marine
    const isCoastal = nemoHasWaves || gfsMarine !== null
    const utcOffset = ((effectiveMarine.utc_offset_seconds ?? weather.utc_offset_seconds) as number) ?? 0
    const timezone = (weather.timezone as string | undefined) ?? (effectiveMarine.timezone as string | undefined) ?? 'UTC'
    const currentIdx = findCurrentHourIndex(weather.hourly.time, utcOffset)

    const report = buildReport(
      effectiveMarine, weather, name, country,
      parseFloat(lat), parseFloat(lon),
      currentIdx, utcOffset, isCoastal, timezone,
      forecastDays, gfsMarine
    )

    report.forecast = report.forecast.slice(0, forecastDays)

    return NextResponse.json(report)
  } catch (e) {
    console.error('Surf API error:', e)
    return NextResponse.json({ error: 'Failed to fetch surf data' }, { status: 500 })
  }
}

function val(arr: unknown[] | undefined, i: number, fallback = 0): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

function blendVal(
  primary: unknown[] | undefined,
  fallback: unknown[] | undefined,
  i: number,
  def = 0
): number {
  const p = primary?.[i]
  if (typeof p === 'number' && !isNaN(p)) return p
  const f = fallback?.[i]
  return typeof f === 'number' && !isNaN(f) ? f : def
}

function buildReport(
  marine: Record<string, unknown>,
  weather: Record<string, unknown>,
  name: string,
  country: string,
  lat: number,
  lon: number,
  currentIdx: number,
  utcOffset: number,
  isCoastal: boolean,
  timezone: string,
  maxDays = 10,
  gfsMarine: Record<string, unknown> | null = null
): SurfReport {
  const calibration = findCalibration(lat, lon)
  const mh = (marine.hourly ?? {}) as Record<string, unknown[]>
  const md = (marine.daily ?? {}) as Record<string, unknown[]>
  const gfsMh = ((gfsMarine?.hourly ?? {}) as Record<string, unknown[]>)
  const gfsMd = ((gfsMarine?.daily ?? {}) as Record<string, unknown[]>)
  const wh = weather.hourly as Record<string, unknown[]>
  const wd = weather.daily as Record<string, unknown[]>
  const wTimes = wh.time as string[]
  const mTimes = (mh.time ?? wTimes) as string[]

  const waveHeight = isCoastal ? val(mh.wave_height, currentIdx) : 0
  const wavePeriod = isCoastal ? val(mh.wave_period, currentIdx) : 0
  const swellHeight = isCoastal ? val(mh.swell_wave_height, currentIdx) : 0
  const swellPeriod = isCoastal ? val(mh.swell_wave_period, currentIdx) : 0
  const swellDir = isCoastal ? val(mh.swell_wave_direction, currentIdx) : 0
  const windWaveH = isCoastal ? val(mh.wind_wave_height, currentIdx) : 0
  const windWaveDir = isCoastal ? val(mh.wind_wave_direction, currentIdx) : 0
  const windWavePer = isCoastal ? val(mh.wind_wave_period, currentIdx) : 0
  const waterTempRaw = isCoastal ? mh.sea_surface_temperature?.[currentIdx] : undefined
  const waterTempNum = typeof waterTempRaw === 'number' && !isNaN(waterTempRaw) && waterTempRaw > -50 ? waterTempRaw : null
  const waterTemp = waterTempNum !== null ? waterTempNum : estimateWaterTemp(lat, new Date().getMonth())

  const swell2H = isCoastal ? val(mh.swell_wave_height_2, currentIdx) : 0
  const swell2Dir = isCoastal ? val(mh.swell_wave_direction_2, currentIdx) : 0
  const swell2Per = isCoastal ? val(mh.swell_wave_period_2, currentIdx) : 0

  const windSpeed = val(wh.wind_speed_10m, currentIdx)
  const windGust = val(wh.wind_gusts_10m, currentIdx)
  const windDir = val(wh.wind_direction_10m, currentIdx)
  const airTemp = val(wh.temperature_2m, currentIdx)
  const weatherCode = val(wh.weather_code, currentIdx)
  const visibility = val(wh.visibility, currentIdx, 10000) / 1000
  const precipProb = val(wh.precipitation_probability, currentIdx)

  // Rate on swell height, not total Hs — wind chop doesn't create surfable waves
  const rawRating = computeSurfRating(swellHeight, wavePeriod, swellHeight, swellPeriod, windSpeed)
  const rating = calibration
    ? applyCalibration(rawRating, swellHeight, swellPeriod, swellDir, calibration)
    : rawRating

  const additionalSwells: SwellInfo[] = []
  if (swell2H > 0.1) {
    additionalSwells.push({
      height: swell2H,
      period: swell2Per,
      direction: swell2Dir,
      directionLabel: getDirectionLabel(swell2Dir),
    })
  }

  const current: CurrentConditions = {
    waveHeight,
    wavePeriod,
    primarySwell: {
      height: swellHeight,
      period: swellPeriod,
      direction: swellDir,
      directionLabel: getDirectionLabel(swellDir),
    },
    additionalSwells: additionalSwells.length > 0 ? additionalSwells : undefined,
    secondarySwell: windWaveH > 0.1 && isCoastal ? {
      height: windWaveH,
      period: windWavePer,
      direction: windWaveDir,
      directionLabel: getDirectionLabel(windWaveDir),
    } : undefined,
    wind: {
      speed: windSpeed,
      gust: windGust,
      direction: windDir,
      directionLabel: getDirectionLabel(windDir),
    },
    waterTemp,
    airTemp,
    weatherCode,
    weatherDescription: getWeatherDescription(weatherCode),
    uvIndex: val(wd.uv_index_max, 0),
    precipProbability: precipProb,
    visibility,
    rating,
  }

  // 48-hour hourly data for chart
  const hourly: HourlyForecast[] = []
  const marineIdx = findCurrentHourIndex(mTimes, utcOffset)
  for (let i = currentIdx; i < Math.min(currentIdx + 48, wTimes.length); i++) {
    const mi = marineIdx + (i - currentIdx)
    hourly.push({
      time: wTimes[i],
      waveHeight: isCoastal ? blendVal(mh.wave_height, gfsMh.wave_height, mi) : 0,
      wavePeriod: isCoastal ? blendVal(mh.wave_period, gfsMh.wave_period, mi) : 0,
      swellHeight: isCoastal ? blendVal(mh.swell_wave_height, gfsMh.swell_wave_height, mi) : 0,
      swellPeriod: isCoastal ? blendVal(mh.swell_wave_period, gfsMh.swell_wave_period, mi) : 0,
      swellDirection: isCoastal ? blendVal(mh.swell_wave_direction, gfsMh.swell_wave_direction, mi) : 0,
      windWaveHeight: isCoastal ? blendVal(mh.wind_wave_height, gfsMh.wind_wave_height, mi) : 0,
      windWavePeriod: isCoastal ? blendVal(mh.wind_wave_period, gfsMh.wind_wave_period, mi) : 0,
      windWaveDirection: isCoastal ? blendVal(mh.wind_wave_direction, gfsMh.wind_wave_direction, mi) : 0,
      swell2Height: isCoastal ? blendVal(mh.swell_wave_height_2, gfsMh.swell_wave_height_2, mi) : 0,
      swell2Period: isCoastal ? blendVal(mh.swell_wave_period_2, gfsMh.swell_wave_period_2, mi) : 0,
      swell2Direction: isCoastal ? blendVal(mh.swell_wave_direction_2, gfsMh.swell_wave_direction_2, mi) : 0,
      swell3Height: 0,
      swell3Period: 0,
      swell3Direction: 0,
      windSpeed: val(wh.wind_speed_10m, i),
      windDirection: val(wh.wind_direction_10m, i),
      weatherCode: val(wh.weather_code, i),
    })
  }

  // Daily forecast (up to maxDays)
  const dailyTimes = (wd.time ?? []) as string[]
  const forecast: DayForecast[] = dailyTimes.slice(0, maxDays).map((date: string, i: number) => {
    // Prefer swell_wave_height_max (NEMO days 1-8); fall back to total wave_height_max
    // from ecmwf_wam for extended days where swell decomposition isn't available.
    const swellHt = isCoastal ? blendVal(md.swell_wave_height_max, gfsMd.swell_wave_height_max, i) : 0
    const wvMax   = swellHt > 0 ? swellHt : (isCoastal ? blendVal(md.wave_height_max, gfsMd.wave_height_max, i) : 0)
    const hasMarineData = isCoastal && wvMax > 0
    const swMax = wvMax
    const swPer = isCoastal
      ? (blendVal(md.swell_wave_period_max, gfsMd.swell_wave_period_max, i) ||
         blendVal(md.wave_period_max,       gfsMd.wave_period_max,       i))
      : 0
    const swDir = isCoastal
      ? (blendVal(md.swell_wave_direction_dominant, gfsMd.swell_wave_direction_dominant, i) ||
         blendVal(md.wave_direction_dominant,        gfsMd.wave_direction_dominant,        i))
      : 0
    const wvPer = isCoastal ? blendVal(md.wave_period_max, gfsMd.wave_period_max, i) : 0
    const windMax = val(wd.wind_speed_10m_max, i)
    const windDir = val(wd.wind_direction_10m_dominant, i)
    const rawDayRating = computeSurfRating(
      wvMax * 0.6, wvPer, swMax * 0.6, swPer, windMax * 0.5
    )
    const dayRating = calibration
      ? applyCalibration(rawDayRating, swMax, swPer, swDir, calibration)
      : rawDayRating
    return {
      date,
      dayName: getDayName(date, i),
      waveHeightMin: wvMax * 0.35,
      waveHeightMax: wvMax,
      wavePeriodMax: wvPer,
      swellHeightMax: swMax,
      swellDirectionDominant: swDir,
      swellDirectionLabel: getDirectionLabel(swDir),
      windSpeedMax: windMax,
      windDirectionDominant: windDir,
      windDirectionLabel: getDirectionLabel(windDir),
      tempMax: val(wd.temperature_2m_max, i),
      tempMin: val(wd.temperature_2m_min, i),
      weatherCode: val(wd.weather_code, i),
      weatherDescription: getWeatherDescription(val(wd.weather_code, i)),
      uvIndexMax: val(wd.uv_index_max, i),
      precipProbabilityMax: val(wd.precipitation_probability_max, i),
      rating: dayRating,
      hasMarineData,
    }
  })

  return {
    location: { name, country, lat, lon },
    current,
    hourly,
    forecast,
    updatedAt: new Date().toISOString(),
    isCoastal,
    timezone,
  }
}

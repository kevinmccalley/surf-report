import { NextRequest, NextResponse } from 'next/server'
import type {
  SurfReport, CurrentConditions, HourlyForecast, DayForecast
} from '@/app/lib/types'
import { computeSurfRating } from '@/app/lib/surf-rating'
import {
  getDirectionLabel, getWeatherDescription,
  findCurrentHourIndex, estimateWaterTemp, getDayName
} from '@/app/lib/utils'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = sp.get('lat')
  const lon = sp.get('lon')
  const name = sp.get('name') ?? 'Unknown Location'
  const country = sp.get('country') ?? ''

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature` +
    `&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max` +
    `&timezone=auto&forecast_days=10`

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,precipitation_probability,visibility` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=10&wind_speed_unit=kmh`

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, { next: { revalidate: 1800 } }),
      fetch(weatherUrl, { next: { revalidate: 1800 } }),
    ])

    const [marine, weather] = await Promise.all([marineRes.json(), weatherRes.json()])

    const isCoastal = !marine.error
    const utcOffset = (marine.utc_offset_seconds ?? weather.utc_offset_seconds) ?? 0
    const timezone = (weather.timezone as string | undefined) ?? (marine.timezone as string | undefined) ?? 'UTC'
    const currentIdx = findCurrentHourIndex(weather.hourly.time, utcOffset)

    const report = buildReport(
      marine, weather, name, country,
      parseFloat(lat), parseFloat(lon),
      currentIdx, utcOffset, isCoastal, timezone
    )

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
  timezone: string
): SurfReport {
  const mh = (marine.hourly ?? {}) as Record<string, unknown[]>
  const md = (marine.daily ?? {}) as Record<string, unknown[]>
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

  const windSpeed = val(wh.wind_speed_10m, currentIdx)
  const windGust = val(wh.wind_gusts_10m, currentIdx)
  const windDir = val(wh.wind_direction_10m, currentIdx)
  const airTemp = val(wh.temperature_2m, currentIdx)
  const weatherCode = val(wh.weather_code, currentIdx)
  const visibility = val(wh.visibility, currentIdx, 10000) / 1000
  const precipProb = val(wh.precipitation_probability, currentIdx)

  const rating = computeSurfRating(waveHeight, wavePeriod, swellHeight, swellPeriod, windSpeed)

  const current: CurrentConditions = {
    waveHeight,
    wavePeriod,
    primarySwell: {
      height: swellHeight,
      period: swellPeriod,
      direction: swellDir,
      directionLabel: getDirectionLabel(swellDir),
    },
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
      waveHeight: isCoastal ? val(mh.wave_height, mi) : 0,
      wavePeriod: isCoastal ? val(mh.wave_period, mi) : 0,
      swellHeight: isCoastal ? val(mh.swell_wave_height, mi) : 0,
      swellPeriod: isCoastal ? val(mh.swell_wave_period, mi) : 0,
      swellDirection: isCoastal ? val(mh.swell_wave_direction, mi) : 0,
      windWaveHeight: isCoastal ? val(mh.wind_wave_height, mi) : 0,
      windWavePeriod: isCoastal ? val(mh.wind_wave_period, mi) : 0,
      windWaveDirection: isCoastal ? val(mh.wind_wave_direction, mi) : 0,
      swell2Height: 0,
      swell2Period: 0,
      swell2Direction: 0,
      swell3Height: 0,
      swell3Period: 0,
      swell3Direction: 0,
      windSpeed: val(wh.wind_speed_10m, i),
      windDirection: val(wh.wind_direction_10m, i),
      weatherCode: val(wh.weather_code, i),
    })
  }

  // 10-day daily forecast
  const dailyTimes = (wd.time ?? []) as string[]
  const forecast: DayForecast[] = dailyTimes.slice(0, 10).map((date: string, i: number) => {
    const wvMax = isCoastal ? val(md.wave_height_max, i) : 0
    const swMax = isCoastal ? val(md.swell_wave_height_max, i) : 0
    const swPer = isCoastal ? val(md.swell_wave_period_max, i) : 0
    const swDir = isCoastal ? val(md.swell_wave_direction_dominant, i) : 0
    const wvPer = isCoastal ? val(md.wave_period_max, i) : 0
    const windMax = val(wd.wind_speed_10m_max, i)
    const windDir = val(wd.wind_direction_10m_dominant, i)
    const dayRating = computeSurfRating(
      wvMax * 0.6, wvPer, swMax * 0.6, swPer, windMax * 0.5
    )
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

import { NextRequest, NextResponse } from 'next/server'
import type { SurfReport, CurrentConditions, HourlyForecast, DayForecast } from '@/app/lib/types'
import { computeSurfRating } from '@/app/lib/surf-rating'
import {
  getDirectionLabel, getWeatherDescription, estimateWaterTemp, getDayName
} from '@/app/lib/utils'

const MIN_DATE = '2022-01-01'

function val(arr: unknown[] | undefined, i: number, fallback = 0): number {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const lat = sp.get('lat')
  const lon = sp.get('lon')
  const name = sp.get('name') ?? 'Unknown'
  const country = sp.get('country') ?? ''
  const date = sp.get('date')

  if (!lat || !lon || !date) {
    return NextResponse.json({ error: 'lat, lon, and date required' }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const maxDate = yesterday.toISOString().slice(0, 10)

  if (date < MIN_DATE || date > maxDate) {
    return NextResponse.json({
      error: `date must be between ${MIN_DATE} and ${maxDate}`,
    }, { status: 400 })
  }

  const startDate = offsetDate(date, -1)
  const endDate = offsetDate(date, 1)

  const weatherUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,` +
    `wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,uv_index_max` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&timezone=auto&wind_speed_unit=kmh`

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,` +
    `wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature` +
    `&daily=wave_height_max,wave_direction_dominant,wave_period_max,` +
    `swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max` +
    `&start_date=${startDate}&end_date=${endDate}`

  try {
    const [weatherRes, marineRes] = await Promise.all([
      fetch(weatherUrl, { cache: 'force-cache' }),
      fetch(marineUrl, { cache: 'force-cache' }),
    ])

    const [weather, marine] = await Promise.all([weatherRes.json(), marineRes.json()])

    if (weather.error) {
      return NextResponse.json({ error: weather.reason ?? 'Weather data unavailable' }, { status: 500 })
    }

    const isCoastal = !marine.error
    const utcOffsetSeconds: number = weather.utc_offset_seconds ?? 0
    const utcOffsetHours = Math.round(utcOffsetSeconds / 3600)
    const timezone: string = weather.timezone ?? 'UTC'

    const wh = weather.hourly as Record<string, unknown[]>
    const wd = weather.daily as Record<string, unknown[]>
    const mh = isCoastal ? ((marine.hourly ?? {}) as Record<string, unknown[]>) : {}
    const md = isCoastal ? ((marine.daily ?? {}) as Record<string, unknown[]>) : {}

    const weatherTimes = wh.time as string[]
    const marineTimes = isCoastal ? ((mh.time ?? weatherTimes) as string[]) : weatherTimes

    // Weather uses timezone=auto → T12:00 is local noon
    const noonWeatherIdx = weatherTimes.findIndex(t => t === `${date}T12:00`)

    // Marine is always UTC → local noon UTC = 12:00 - utcOffsetHours
    const noonUtcHour = 12 - utcOffsetHours
    const noonMarineIdx = (noonUtcHour >= 0 && noonUtcHour < 24)
      ? marineTimes.findIndex(t => t === `${date}T${String(noonUtcHour).padStart(2, '0')}:00`)
      : -1

    const wi = noonWeatherIdx >= 0 ? noonWeatherIdx : 36
    const mi = noonMarineIdx >= 0 ? noonMarineIdx : (noonWeatherIdx >= 0 ? noonWeatherIdx : 36)

    const latNum = parseFloat(lat)
    const dateMonth = new Date(date + 'T12:00:00Z').getUTCMonth()

    const waveHeight = isCoastal ? val(mh.wave_height, mi) : 0
    const wavePeriod = isCoastal ? val(mh.wave_period, mi) : 0
    const swellHeight = isCoastal ? val(mh.swell_wave_height, mi) : 0
    const swellPeriod = isCoastal ? val(mh.swell_wave_period, mi) : 0
    const swellDir = isCoastal ? val(mh.swell_wave_direction, mi) : 0
    const windWaveH = isCoastal ? val(mh.wind_wave_height, mi) : 0
    const windWaveDir = isCoastal ? val(mh.wind_wave_direction, mi) : 0
    const windWavePer = isCoastal ? val(mh.wind_wave_period, mi) : 0
    const waterTempRaw = isCoastal ? mh.sea_surface_temperature?.[mi] : undefined
    const waterTempNum = typeof waterTempRaw === 'number' && !isNaN(waterTempRaw) && waterTempRaw > -50
      ? waterTempRaw : null
    const waterTemp = waterTempNum !== null ? waterTempNum : estimateWaterTemp(latNum, dateMonth)

    const windSpeed = val(wh.wind_speed_10m, wi)
    const windGust = val(wh.wind_gusts_10m, wi)
    const windDir = val(wh.wind_direction_10m, wi)
    const airTemp = val(wh.temperature_2m, wi)
    const weatherCode = val(wh.weather_code, wi)

    const dailyTimes = (wd.time ?? []) as string[]
    const dailyIdx = dailyTimes.findIndex(t => t === date)

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
      uvIndex: dailyIdx >= 0 ? val(wd.uv_index_max, dailyIdx) : 0,
      precipProbability: 0,
      visibility: 10,
      rating,
    }

    // 24 hours for the target date (weather local times, marine UTC times)
    const dayStartWeatherIdx = weatherTimes.findIndex(t => t.startsWith(date))
    // For marine, find the UTC start of the local day
    const localDayStartUtcHour = -utcOffsetHours
    let marineStartIdx: number
    if (localDayStartUtcHour >= 0) {
      marineStartIdx = marineTimes.findIndex(
        t => t === `${date}T${String(localDayStartUtcHour).padStart(2, '0')}:00`
      )
    } else {
      // Local midnight is in the previous UTC day
      const prevDate = offsetDate(date, -1)
      const prevHour = 24 + localDayStartUtcHour
      marineStartIdx = marineTimes.findIndex(
        t => t === `${prevDate}T${String(prevHour).padStart(2, '0')}:00`
      )
    }
    // Fallback: just use the marine index where the date string starts
    if (marineStartIdx < 0) {
      marineStartIdx = marineTimes.findIndex(t => t.startsWith(date))
    }

    const hourly: HourlyForecast[] = []
    for (let h = 0; h < 24; h++) {
      const wIdx = dayStartWeatherIdx >= 0 ? dayStartWeatherIdx + h : -1
      const mIdx = marineStartIdx >= 0 ? marineStartIdx + h : -1
      if (wIdx < 0 || wIdx >= weatherTimes.length) break
      hourly.push({
        time: weatherTimes[wIdx],
        waveHeight: isCoastal && mIdx >= 0 ? val(mh.wave_height, mIdx) : 0,
        wavePeriod: isCoastal && mIdx >= 0 ? val(mh.wave_period, mIdx) : 0,
        swellHeight: isCoastal && mIdx >= 0 ? val(mh.swell_wave_height, mIdx) : 0,
        swellDirection: isCoastal && mIdx >= 0 ? val(mh.swell_wave_direction, mIdx) : 0,
        windSpeed: val(wh.wind_speed_10m, wIdx),
        windDirection: val(wh.wind_direction_10m, wIdx),
        weatherCode: val(wh.weather_code, wIdx),
      })
    }

    // Single-day daily entry
    const forecast: DayForecast[] = []
    if (dailyIdx >= 0) {
      const dWvMax = isCoastal ? val(md.wave_height_max, dailyIdx) : 0
      const dSwMax = isCoastal ? val(md.swell_wave_height_max, dailyIdx) : 0
      const dSwPer = isCoastal ? val(md.swell_wave_period_max, dailyIdx) : 0
      const dSwDir = isCoastal ? val(md.swell_wave_direction_dominant, dailyIdx) : 0
      const dWvPer = isCoastal ? val(md.wave_period_max, dailyIdx) : 0
      const dWindMax = val(wd.wind_speed_10m_max, dailyIdx)
      const dWindDir = val(wd.wind_direction_10m_dominant, dailyIdx)
      const dayRating = computeSurfRating(dWvMax * 0.6, dWvPer, dSwMax * 0.6, dSwPer, dWindMax * 0.5)
      forecast.push({
        date,
        dayName: getDayName(date, 99),
        waveHeightMin: dWvMax * 0.35,
        waveHeightMax: dWvMax,
        wavePeriodMax: dWvPer,
        swellHeightMax: dSwMax,
        swellDirectionDominant: dSwDir,
        swellDirectionLabel: getDirectionLabel(dSwDir),
        windSpeedMax: dWindMax,
        windDirectionDominant: dWindDir,
        windDirectionLabel: getDirectionLabel(dWindDir),
        tempMax: val(wd.temperature_2m_max, dailyIdx),
        tempMin: val(wd.temperature_2m_min, dailyIdx),
        weatherCode: val(wd.weather_code, dailyIdx),
        weatherDescription: getWeatherDescription(val(wd.weather_code, dailyIdx)),
        uvIndexMax: val(wd.uv_index_max, dailyIdx),
        precipProbabilityMax: 0,
        rating: dayRating,
      })
    }

    const report: SurfReport = {
      location: { name, country, lat: latNum, lon: parseFloat(lon) },
      current,
      hourly,
      forecast,
      updatedAt: new Date().toISOString(),
      isCoastal,
      timezone,
      historical: true,
      historicalDate: date,
    }

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch (e) {
    console.error('[surf-history] error:', e)
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 })
  }
}

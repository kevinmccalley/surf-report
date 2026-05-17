import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDirectionLabel,
  metersToFeet,
  formatWaveHeight,
  formatWaveRange,
  formatTemp,
  getWeatherDescription,
  findCurrentHourIndex,
  estimateWaterTemp,
  formatHour,
  getDayName,
  omUrl,
} from '../utils'

// ── getDirectionLabel ────────────────────────────────────────────────────────

describe('getDirectionLabel', () => {
  it('returns N for 0°', () => expect(getDirectionLabel(0)).toBe('N'))
  it('returns E for 90°', () => expect(getDirectionLabel(90)).toBe('E'))
  it('returns S for 180°', () => expect(getDirectionLabel(180)).toBe('S'))
  it('returns W for 270°', () => expect(getDirectionLabel(270)).toBe('W'))
  it('returns NE for 45°', () => expect(getDirectionLabel(45)).toBe('NE'))
  it('returns NNE for 22.5°', () => expect(getDirectionLabel(22.5)).toBe('NNE'))
  it('returns NNW for 337.5°', () => expect(getDirectionLabel(337.5)).toBe('NNW'))
  it('wraps 360° back to N', () => expect(getDirectionLabel(360)).toBe('N'))
  it('returns SSE for 157.5°', () => expect(getDirectionLabel(157.5)).toBe('SSE'))
  it('returns WSW for 247.5°', () => expect(getDirectionLabel(247.5)).toBe('WSW'))
})

// ── metersToFeet ─────────────────────────────────────────────────────────────

describe('metersToFeet', () => {
  it('formats sub-foot values to one decimal', () => expect(metersToFeet(0.1)).toBe('0.3ft'))
  it('rounds 0.3m (0.98ft) to 1ft', () => expect(metersToFeet(0.3)).toBe('1ft'))
  it('rounds 0.5m to nearest 0.5ft', () => expect(metersToFeet(0.5)).toBe('1.5ft'))
  it('rounds 1.0m to nearest 0.5ft', () => expect(metersToFeet(1.0)).toBe('3.5ft'))
  it('rounds 1.5m to nearest 0.5ft', () => expect(metersToFeet(1.5)).toBe('5ft'))
  it('rounds 3.0m (9.84ft) to nearest 0.5ft', () => expect(metersToFeet(3.0)).toBe('10ft'))
  it('rounds large values to nearest whole foot', () => expect(metersToFeet(3.5)).toBe('11ft'))
  it('returns 0ft for 0m', () => expect(metersToFeet(0)).toBe('0ft'))
})

// ── formatWaveHeight ─────────────────────────────────────────────────────────

describe('formatWaveHeight', () => {
  it('delegates to metersToFeet by default', () => expect(formatWaveHeight(1.0)).toBe('3.5ft'))
  it('formats in metres when unit is m', () => expect(formatWaveHeight(1.5, 'm')).toBe('1.5m'))
  it('formats 0.3m correctly in metres', () => expect(formatWaveHeight(0.3, 'm')).toBe('0.3m'))
})

// ── formatWaveRange ───────────────────────────────────────────────────────────

describe('formatWaveRange', () => {
  it('collapses to single value when min and max round to same ft', () => {
    expect(formatWaveRange(0.5, 0.5)).toBe('1.5ft')
  })
  it('collapses when difference is under 0.5ft', () => {
    // 1.0m = 3.5ft, 1.05m ≈ 3.5ft — diff < 0.5
    expect(formatWaveRange(1.0, 1.05)).toBe('3.5ft')
  })
  it('shows range when difference is 0.5ft or more', () => {
    expect(formatWaveRange(0.5, 1.0)).toBe('1.5–3.5ft')
  })
  it('formats metre range when unit is m', () => {
    expect(formatWaveRange(1.0, 2.0, 'm')).toBe('1.0–2.0m')
  })
  it('always uses endash separator', () => {
    expect(formatWaveRange(0.5, 2.0)).toContain('–')
  })
})

// ── formatTemp ───────────────────────────────────────────────────────────────

describe('formatTemp', () => {
  it('converts 0°C to 32°F', () => expect(formatTemp(0, 'f')).toBe('32°F'))
  it('converts 20°C to 68°F', () => expect(formatTemp(20, 'f')).toBe('68°F'))
  it('converts 100°C to 212°F', () => expect(formatTemp(100, 'f')).toBe('212°F'))
  it('formats Celsius when unit is c', () => expect(formatTemp(20, 'c')).toBe('20°C'))
  it('rounds Celsius values', () => expect(formatTemp(20.6, 'c')).toBe('21°C'))
  it('rounds Fahrenheit values', () => expect(formatTemp(37, 'f')).toBe('99°F'))
  it('defaults to Fahrenheit', () => expect(formatTemp(0)).toBe('32°F'))
})

// ── getWeatherDescription ─────────────────────────────────────────────────────

describe('getWeatherDescription', () => {
  it('describes code 0 as Clear Sky', () => expect(getWeatherDescription(0)).toBe('Clear Sky'))
  it('describes code 3 as Overcast', () => expect(getWeatherDescription(3)).toBe('Overcast'))
  it('describes code 61 as Light Rain', () => expect(getWeatherDescription(61)).toBe('Light Rain'))
  it('describes code 63 as Rain', () => expect(getWeatherDescription(63)).toBe('Rain'))
  it('describes code 95 as Thunderstorm', () => expect(getWeatherDescription(95)).toBe('Thunderstorm'))
  it('describes code 96 as Thunderstorm w/ Hail', () => expect(getWeatherDescription(96)).toBe('Thunderstorm w/ Hail'))
  it('returns Unknown for unrecognised code', () => expect(getWeatherDescription(999)).toBe('Unknown'))
  it('returns Unknown for negative code', () => expect(getWeatherDescription(-1)).toBe('Unknown'))
})

// ── findCurrentHourIndex ──────────────────────────────────────────────────────

describe('findCurrentHourIndex', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the index of the matching hour', () => {
    vi.setSystemTime(new Date('2025-05-13T07:00:00Z'))
    const times = ['2025-05-13T06:00', '2025-05-13T07:00', '2025-05-13T08:00']
    expect(findCurrentHourIndex(times, 0)).toBe(1)
  })

  it('applies utcOffsetSeconds to find local time', () => {
    // UTC time is 06:00, offset +1h → local 07:00
    vi.setSystemTime(new Date('2025-05-13T06:00:00Z'))
    const times = ['2025-05-13T06:00', '2025-05-13T07:00', '2025-05-13T08:00']
    expect(findCurrentHourIndex(times, 3600)).toBe(1)
  })

  it('falls back to latest past time when current hour not in array', () => {
    vi.setSystemTime(new Date('2025-05-13T09:30:00Z'))
    const times = ['2025-05-13T07:00', '2025-05-13T08:00', '2025-05-13T10:00']
    // 09:30 → target is 09:00, not in array. Closest past: 08:00 at index 1
    expect(findCurrentHourIndex(times, 0)).toBe(1)
  })

  it('returns 0 when all times are in the future', () => {
    vi.setSystemTime(new Date('2025-05-13T05:00:00Z'))
    const times = ['2025-05-13T06:00', '2025-05-13T07:00']
    expect(findCurrentHourIndex(times, 0)).toBe(0)
  })
})

// ── estimateWaterTemp ─────────────────────────────────────────────────────────

describe('estimateWaterTemp', () => {
  it('equator is warm year-round (~25–28°C)', () => {
    const temp = estimateWaterTemp(0, 5) // June at equator
    expect(temp).toBeGreaterThanOrEqual(24)
    expect(temp).toBeLessThanOrEqual(29)
  })

  it('northern tropics in summer are warm', () => {
    // lat=21 (Hawaii), monthIndex=7 (August) = northern summer
    const temp = estimateWaterTemp(21, 7)
    expect(temp).toBeGreaterThan(20)
  })

  it('northern tropics in winter are cooler than summer', () => {
    const summer = estimateWaterTemp(21, 7)   // Aug
    const winter = estimateWaterTemp(21, 1)   // Feb
    expect(summer).toBeGreaterThan(winter)
  })

  it('southern hemisphere seasons are flipped', () => {
    // lat=-35 (South Africa): summer is Nov–Feb, winter is Jun–Aug
    const summer = estimateWaterTemp(-35, 0) // January = southern summer
    const winter = estimateWaterTemp(-35, 6) // July = southern winter
    expect(summer).toBeGreaterThan(winter)
  })

  it('polar latitudes clamp to 0°C minimum', () => {
    const temp = estimateWaterTemp(80, 1) // Arctic, February
    expect(temp).toBeGreaterThanOrEqual(0)
  })

  it('result is rounded to one decimal place', () => {
    const temp = estimateWaterTemp(34, 5)
    expect(temp).toBe(Math.round(temp * 10) / 10)
  })
})

// ── formatHour ───────────────────────────────────────────────────────────────

describe('formatHour', () => {
  it('formats midnight as 12am', () => expect(formatHour('2025-05-13T00:00')).toBe('12am'))
  it('formats noon as 12pm', () => expect(formatHour('2025-05-13T12:00')).toBe('12pm'))
  it('formats morning hours as Xam', () => expect(formatHour('2025-05-13T07:00')).toBe('7am'))
  it('formats afternoon hours as Xpm', () => expect(formatHour('2025-05-13T15:00')).toBe('3pm'))
  it('formats 11pm correctly', () => expect(formatHour('2025-05-13T23:00')).toBe('11pm'))
  it('formats 1am correctly', () => expect(formatHour('2025-05-13T01:00')).toBe('1am'))
  it('formats 1pm correctly', () => expect(formatHour('2025-05-13T13:00')).toBe('1pm'))
})

// ── getDayName ───────────────────────────────────────────────────────────────

describe('getDayName', () => {
  it('returns Today for index 0', () => expect(getDayName('2025-05-13', 0)).toBe('Today'))
  it('returns Tomorrow for index 1', () => expect(getDayName('2025-05-13', 1)).toBe('Tomorrow'))
  it('returns short weekday name for index >= 2', () => {
    const name = getDayName('2025-05-13', 2)
    expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).toContain(name)
  })
  it('is not Today or Tomorrow for index >= 2', () => {
    const name = getDayName('2025-05-20', 2)
    expect(name).not.toBe('Today')
    expect(name).not.toBe('Tomorrow')
  })
})

// ── omUrl ────────────────────────────────────────────────────────────────────

describe('omUrl', () => {
  it('returns the url unchanged when no API key is set', () => {
    vi.stubEnv('OPEN_METEO_API_KEY', '')
    expect(omUrl('https://api.example.com?foo=1')).toBe('https://api.example.com?foo=1')
    vi.unstubAllEnvs()
  })

  it('appends apikey param when env var is set', () => {
    vi.stubEnv('OPEN_METEO_API_KEY', 'my-key')
    expect(omUrl('https://api.example.com?foo=1')).toBe('https://api.example.com?foo=1&apikey=my-key')
    vi.unstubAllEnvs()
  })
})

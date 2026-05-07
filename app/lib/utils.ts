export function getDirectionLabel(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(((degrees % 360) / 360) * 16) % 16
  return dirs[index]
}

export function metersToFeet(meters: number): string {
  const feet = meters * 3.281
  if (feet < 1) return `${Math.round(feet * 10) / 10}ft`
  if (feet < 10) return `${Math.round(feet * 2) / 2}ft`
  return `${Math.round(feet)}ft`
}

export function formatWaveHeight(meters: number, unit: 'ft' | 'm' = 'ft'): string {
  if (unit === 'm') return `${meters.toFixed(1)}m`
  return metersToFeet(meters)
}

export function formatWaveRange(minM: number, maxM: number, unit: 'ft' | 'm' = 'ft'): string {
  if (unit === 'm') {
    return `${minM.toFixed(1)}–${maxM.toFixed(1)}m`
  }
  const minFt = Math.round(minM * 3.281 * 2) / 2
  const maxFt = Math.round(maxM * 3.281 * 2) / 2
  if (Math.abs(maxFt - minFt) < 0.5) return `${maxFt}ft`
  return `${minFt}–${maxFt}ft`
}

export function formatTemp(celsius: number, unit: 'c' | 'f' = 'f'): string {
  if (unit === 'c') return `${Math.round(celsius)}°C`
  return `${Math.round(celsius * 9 / 5 + 32)}°F`
}

export function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy Fog',
    51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
    61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    77: 'Snow Grains', 80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Snow Showers', 86: 'Heavy Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Severe Thunderstorm',
  }
  return map[code] ?? 'Unknown'
}

export function findCurrentHourIndex(times: string[], utcOffsetSeconds: number): number {
  const localMs = Date.now() + utcOffsetSeconds * 1000
  const d = new Date(localMs)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hour = String(d.getUTCHours()).padStart(2, '0')
  const target = `${year}-${month}-${day}T${hour}:00`

  const index = times.findIndex(t => t === target)
  if (index >= 0) return index

  // Fallback: find closest
  for (let i = times.length - 1; i >= 0; i--) {
    if (times[i] <= target) return i
  }
  return 0
}

export function estimateWaterTemp(lat: number, monthIndex: number): number {
  const absLat = Math.abs(lat)
  const isNorthern = lat > 0
  const isSummer = isNorthern ? (monthIndex >= 5 && monthIndex <= 9) : (monthIndex <= 2 || monthIndex >= 10)
  const base = 28 - absLat * 0.43
  const seasonal = isSummer ? 2.5 : -2.5
  return Math.max(0, Math.round((base + seasonal) * 10) / 10)
}

export function formatHour(isoTime: string): string {
  const hour = parseInt(isoTime.slice(11, 13), 10)
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export function getDayName(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

// Appends the Open-Meteo commercial API key when present.
// Set OPEN_METEO_API_KEY in environment variables after purchasing a plan.
export function omUrl(url: string): string {
  const key = process.env.OPEN_METEO_API_KEY
  return key ? `${url}&apikey=${key}` : url
}

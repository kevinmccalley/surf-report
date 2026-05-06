/**
 * Standalone script: checks all notable spots and writes Epic-rated ones to Redis.
 * Run: node scripts/run-epic-now.mjs
 */
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const { default: Redis } = await import('ioredis')

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
})
redis.on('error', () => {})

const NOTABLE_SPOTS = JSON.parse(
  readFileSync(resolve(__dirname, '../app/lib/notable-spots.json'), 'utf8')
)

function getDirectionLabel(degrees) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((degrees % 360) / 360) * 16) % 16]
}

function computeSurfRating(waveHeight, wavePeriod, swellHeight, swellPeriod, windSpeed) {
  if (waveHeight < 0.15) return { label: 'FLAT', score: 0 }
  let h = waveHeight < 0.3 ? 0.5 : waveHeight < 0.6 ? 1.5 : waveHeight < 0.9 ? 2.5
        : waveHeight < 1.5 ? 3.2 : waveHeight < 2.0 ? 3.7 : waveHeight < 3.0 ? 4.0
        : waveHeight < 4.5 ? 3.8 : 3.2
  const ep = Math.max(wavePeriod, swellPeriod)
  let p = ep < 6 ? 0 : ep < 8 ? 0.6 : ep < 10 ? 1.2 : ep < 12 ? 1.7
        : ep < 15 ? 2.2 : ep < 18 ? 2.7 : 3.0
  let w = windSpeed < 8 ? 3.0 : windSpeed < 15 ? 2.4 : windSpeed < 22 ? 1.6
        : windSpeed < 30 ? 0.8 : windSpeed < 40 ? 0.3 : 0
  const score = h + p + w
  const label = score < 1.5 ? 'POOR' : score < 3.5 ? 'POOR TO FAIR' : score < 5.0 ? 'FAIR'
              : score < 6.5 ? 'FAIR TO GOOD' : score < 7.8 ? 'GOOD' : score < 9.0 ? 'VERY GOOD' : 'EPIC'
  return { label, score }
}

function findCurrentHourIndex(times, utcOffsetSeconds) {
  const localNow = Date.now() + utcOffsetSeconds * 1000
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - localNow)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}

function val(arr, i) {
  const v = arr?.[i]
  return typeof v === 'number' && !isNaN(v) ? v : 0
}

async function checkSpot(spot) {
  const base = `latitude=${spot.lat}&longitude=${spot.lon}`
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?${base}&hourly=wave_height,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=auto&forecast_hours=4`
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?${base}&hourly=wind_speed_10m&timezone=auto&forecast_hours=4&wind_speed_unit=kmh`
  try {
    const [mr, wr] = await Promise.all([
      fetch(marineUrl, { signal: AbortSignal.timeout(8000) }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(8000) }),
    ])
    if (!mr.ok || !wr.ok) return null
    const [marine, weather] = await Promise.all([mr.json(), wr.json()])
    if (marine.error) return null
    const utcOffset = marine.utc_offset_seconds ?? weather.utc_offset_seconds ?? 0
    const idx = findCurrentHourIndex(weather.hourly.time, utcOffset)
    const mh = marine.hourly
    const wh = weather.hourly
    const waveHeight = val(mh.wave_height, idx)
    const wavePeriod = val(mh.wave_period, idx)
    const swellHeight = val(mh.swell_wave_height, idx)
    const swellPeriod = val(mh.swell_wave_period, idx)
    const swellDir = val(mh.swell_wave_direction, idx)
    const windSpeed = val(wh.wind_speed_10m, idx)
    const rating = computeSurfRating(waveHeight, wavePeriod, swellHeight, swellPeriod, windSpeed)
    if (rating.label === 'FLAT' || rating.label === 'POOR') return null
    return { name: spot.name, lat: spot.lat, lon: spot.lon, waveHeight, wavePeriod,
             swellDir, swellDirLabel: getDirectionLabel(swellDir), windSpeed,
             score: rating.score, ratingLabel: rating.label }
  } catch { return null }
}

async function runWithConcurrency(tasks, concurrency) {
  const results = new Array(tasks.length)
  let i = 0
  async function worker() {
    while (i < tasks.length) { const idx = i++; results[idx] = await tasks[idx]() }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

console.log(`Checking ${NOTABLE_SPOTS.length} spots...`)
const tasks = NOTABLE_SPOTS.map(s => () => checkSpot(s))
const results = await runWithConcurrency(tasks, 20)
const topSpots = results.filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 12)

console.log(`\nTop spots found: ${topSpots.length}`)
topSpots.forEach(s => console.log(`  [${s.ratingLabel}] ${s.name}: ${s.waveHeight.toFixed(1)}m @ ${s.wavePeriod.toFixed(0)}s, wind ${s.windSpeed.toFixed(0)} km/h (score ${s.score.toFixed(1)})`))

const data = { spots: topSpots, updatedAt: new Date().toISOString(), checkedCount: NOTABLE_SPOTS.length }
await redis.set('epic-now', JSON.stringify(data), 'EX', 21600)
console.log('\nWritten to Redis.')
redis.disconnect()

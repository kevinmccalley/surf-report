export type SurfRatingLabel =
  | 'FLAT'
  | 'POOR'
  | 'POOR TO FAIR'
  | 'FAIR'
  | 'FAIR TO GOOD'
  | 'GOOD'
  | 'VERY GOOD'
  | 'EPIC'

export interface SurfRating {
  label: SurfRatingLabel
  score: number
  color: string
  bgColor: string
  textColor: string
}

export interface SwellInfo {
  height: number
  period: number
  direction: number
  directionLabel: string
}

export interface WindInfo {
  speed: number
  gust: number
  direction: number
  directionLabel: string
}

export interface CurrentConditions {
  waveHeight: number
  wavePeriod: number
  primarySwell: SwellInfo
  secondarySwell?: SwellInfo
  wind: WindInfo
  waterTemp: number | null
  airTemp: number
  weatherCode: number
  weatherDescription: string
  uvIndex: number
  precipProbability: number
  visibility: number
  rating: SurfRating
}

export interface HourlyForecast {
  time: string
  waveHeight: number
  wavePeriod: number
  swellHeight: number
  swellPeriod: number
  swellDirection: number
  windWaveHeight: number
  windWavePeriod: number
  windWaveDirection: number
  swell2Height: number
  swell2Period: number
  swell2Direction: number
  swell3Height: number
  swell3Period: number
  swell3Direction: number
  windSpeed: number
  windDirection: number
  weatherCode: number
}

export interface DayForecast {
  date: string
  dayName: string
  waveHeightMin: number
  waveHeightMax: number
  wavePeriodMax: number
  swellHeightMax: number
  swellDirectionDominant: number
  swellDirectionLabel: string
  windSpeedMax: number
  windDirectionDominant: number
  windDirectionLabel: string
  tempMax: number
  tempMin: number
  weatherCode: number
  weatherDescription: string
  uvIndexMax: number
  precipProbabilityMax: number
  rating: SurfRating
}

export interface SurfLocation {
  name: string
  country: string
  lat: number
  lon: number
}

export interface SurfReport {
  location: SurfLocation
  current: CurrentConditions
  hourly: HourlyForecast[]
  forecast: DayForecast[]
  updatedAt: string
  isCoastal: boolean
  timezone: string  // IANA name e.g. "America/Los_Angeles"
  historical?: boolean
  historicalDate?: string  // YYYY-MM-DD
}

export interface NearbySpot {
  name: string
  lat: number
  lon: number
  distanceKm: number
  waveHeight: number
  wavePeriod: number
  swellDirection: number
  swellDirectionLabel: string
  windSpeed: number
  windDirection: number
  windDirectionLabel: string
  waterTemp: number | null
  airTemp: number
  weatherCode: number
  rating: SurfRating
}

export interface GeoResult {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
  displayName: string
}

export interface TideExtreme {
  time: string     // ISO datetime string
  height: number   // meters
  type: 'High' | 'Low'
}

export interface TideHeight {
  time: string
  height: number   // meters
}

export interface TideReport {
  available: true
  extremes: TideExtreme[]
  hourly: TideHeight[]
  datum: string
  source: 'noaa' | 'dfo' | 'worldtides' | 'open-meteo'
  estimated: boolean
  timeFormat: 'noaa-local' | 'iso-utc' | 'iso-local'
  stationName?: string
  stationId?: string
  stationDistanceKm?: number
  timezoneLabel?: string  // e.g. "PST", "AWST" — set when UTC times have been converted to local
  qualityWarning?: string // set when model coverage or station distance is poor
  observedOffset?: number | null  // meters; positive = above predicted (storm surge); NOAA only
  observedAt?: string             // time of most recent observation used for offset
}

export interface TideUnavailable {
  available: false
  reason: 'out_of_range' | 'fetch_error' | 'no_stations' | string
  nearestStationName?: string
  nearestStationDistanceKm?: number
}

export interface BuoyReading {
  stationId: string
  stationName: string
  lat: number
  lon: number
  distanceKm: number
  waveHeight: number        // meters
  wavePeriod: number | null // seconds (dominant)
  waveDirection: number | null  // degrees
  waterTemp: number | null  // °C
  windSpeed: number | null  // km/h
  windDirection: number | null  // degrees
  airTemp: number | null    // °C
  observedAt: string        // ISO UTC
}

export interface EpicSpot {
  name: string
  lat: number
  lon: number
  waveHeight: number
  wavePeriod: number
  swellDir: number
  swellDirLabel: string
  windSpeed: number
  score: number
  ratingLabel: string
}

export interface EpicNowData {
  spots: EpicSpot[]
  updatedAt: string
  checkedCount: number
}

export interface SavedLocation {
  name: string
  country: string
  displayName: string
  lat: number
  lon: number
  savedAt: string
}

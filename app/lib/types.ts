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
  swellDirection: number
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
}

export interface TideUnavailable {
  available: false
  reason: 'out_of_range' | 'fetch_error' | 'no_stations' | string
  nearestStationName?: string
  nearestStationDistanceKm?: number
}

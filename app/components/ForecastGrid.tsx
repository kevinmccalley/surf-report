'use client'

import type { DayForecast } from '@/app/lib/types'
import { formatWaveRange, formatTemp } from '@/app/lib/utils'
import WeatherIcon from './WeatherIcon'

interface Props {
  forecast: DayForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  isCoastal: boolean
}

export default function ForecastGrid({ forecast, units, isCoastal }: Props) {
  return (
    <div className="overflow-x-auto forecast-scroll -mx-1 px-1">
      <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 pb-1">
        {forecast.map(day => (
          <ForecastCard key={day.date} day={day} units={units} isCoastal={isCoastal} />
        ))}
      </div>
    </div>
  )
}

function ForecastCard({ day, units, isCoastal }: {
  day: DayForecast
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  isCoastal: boolean
}) {
  const { rating } = day
  const isToday = day.dayName === 'Today'

  return (
    <div
      className={`
        flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default
        hover:border-sky-500/30 hover:bg-sky-500/5
        w-[88px] sm:w-auto shrink-0 sm:shrink
        ${isToday
          ? 'border-sky-500/30 bg-sky-500/5'
          : 'glass-card'
        }
      `}
    >
      {/* Day name */}
      <p className={`text-xs font-semibold truncate ${isToday ? 'text-sky-300' : 'text-slate-400'}`}>
        {day.dayName}
      </p>

      {/* Weather icon */}
      <div className="text-center">
        <WeatherIcon code={day.weatherCode} size={22} />
      </div>

      {/* Surf rating */}
      {isCoastal && (
        <div
          className="text-center text-xs font-bold py-0.5 rounded-md"
          style={{ backgroundColor: rating.bgColor, color: rating.textColor }}
          title={rating.label}
        >
          {rating.label === 'FLAT' ? '–' :
           rating.label === 'POOR' ? '★' :
           rating.label === 'POOR TO FAIR' ? '★★' :
           rating.label === 'FAIR' ? '★★★' :
           rating.label === 'FAIR TO GOOD' ? '★★★' :
           rating.label === 'GOOD' ? '★★★★' :
           rating.label === 'VERY GOOD' ? '★★★★' : '★★★★★'
          }
        </div>
      )}

      {/* Wave height */}
      {isCoastal && (
        <p className="text-xs font-semibold text-white text-center">
          {formatWaveRange(day.waveHeightMin, day.waveHeightMax, units.height)}
        </p>
      )}

      {/* Swell direction */}
      {isCoastal && (
        <div className="flex items-center gap-1 text-xs text-sky-400/80">
          <SwellIcon />
          <span className="font-medium">{day.swellDirectionLabel}</span>
        </div>
      )}

      {/* Temp */}
      <div className="flex justify-between text-xs">
        <span className="text-white font-medium">{formatTemp(day.tempMax, units.temp)}</span>
        <span className="text-slate-500">{formatTemp(day.tempMin, units.temp)}</span>
      </div>

      {/* Wind */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <WindIcon />
        <WindArrow direction={day.windDirectionDominant} />
        <span>{Math.round(day.windSpeedMax)}</span>
      </div>

      {/* Precip probability */}
      {day.precipProbabilityMax > 15 && (
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <span>💧</span>
          <span>{day.precipProbabilityMax}%</span>
        </div>
      )}
    </div>
  )
}

function WindIcon() {
  return (
    <svg width="11" height="10" viewBox="0 0 11 10" fill="none" aria-hidden>
      <path d="M1 2.5h6.5a1.25 1.25 0 0 1 0 2.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1 6.5h4a1 1 0 0 1 0 2H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SwellIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path
        d="M0.5 5.5 C1.5 3.5, 2.5 3.5, 3.5 5.5 C4.5 7.5, 5.5 7.5, 6.5 5.5 C7.5 3.5, 8.5 3.5, 9.5 5.5 C10 6.5, 10.5 6.5, 11.5 5.5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"
      />
      <path
        d="M0.5 2 C1.5 0.5, 2.5 0.5, 3.5 2 C4.5 3.5, 5.5 3.5, 6.5 2"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5"
      />
    </svg>
  )
}

function WindArrow({ direction }: { direction: number }) {
  return (
    <span
      className="inline-block text-slate-400"
      style={{ transform: `rotate(${direction}deg)`, display: 'inline-block', fontSize: 10 }}
      title={`Wind from ${direction}°`}
    >
      ↑
    </span>
  )
}

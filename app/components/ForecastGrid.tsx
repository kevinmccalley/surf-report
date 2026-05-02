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

      {/* Surf rating dot */}
      {isCoastal && (
        <div
          className="text-center text-xs font-bold py-0.5 rounded-md"
          style={{
            backgroundColor: rating.bgColor,
            color: rating.textColor,
          }}
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

      {/* Temp */}
      <div className="flex justify-between text-xs">
        <span className="text-white font-medium">{formatTemp(day.tempMax, units.temp)}</span>
        <span className="text-slate-500">{formatTemp(day.tempMin, units.temp)}</span>
      </div>

      {/* Wind */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
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

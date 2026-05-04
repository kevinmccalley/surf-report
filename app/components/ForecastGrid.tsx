'use client'

import { useState } from 'react'
import type { DayForecast } from '@/app/lib/types'
import { formatWaveRange, formatTemp } from '@/app/lib/utils'
import WeatherIcon from './WeatherIcon'

interface Props {
  forecast: DayForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  isCoastal: boolean
}

function generateDaySummary(day: DayForecast, isCoastal: boolean, units: Props['units']): string {
  if (!isCoastal) {
    const hi     = formatTemp(day.tempMax, units.temp)
    const lo     = formatTemp(day.tempMin, units.temp)
    const wind   = Math.round(day.windSpeedMax)
    const precip = day.precipProbabilityMax > 30 ? ` with ${day.precipProbabilityMax}% chance of rain` : ''
    return `${hi} high, ${lo} low. ${wind} km/h ${day.windDirectionLabel} winds${precip}.`
  }

  const waves  = formatWaveRange(day.waveHeightMin, day.waveHeightMax, units.height)
  const dir    = day.swellDirectionLabel
  const period = day.wavePeriodMax
  const label  = day.rating.label

  const summaries: Record<string, string> = {
    'EPIC':         `Block your calendar — ${waves} of ${dir} groundswell at ${period}s. A session you'll remember for years.`,
    'VERY GOOD':    `Outstanding conditions. ${waves} ${dir} swell at ${period}s — paddle out early and stay all day.`,
    'GOOD':         `Solid day with ${waves} ${dir} swell at ${period}s. Definitely worth suiting up.`,
    'FAIR TO GOOD': `Decent ${waves} ${dir} swell at ${period}s. A rewarding session if you time it right.`,
    'FAIR':         `Workable ${waves} ${dir} waves — not epic, but worth a paddle if you're keen.`,
    'POOR TO FAIR': `Marginal ${waves} ${dir} conditions. Go if there's nothing else on.`,
    'POOR':         `Small, messy ${waves} ${dir} swell. Stick to sheltered spots or stay on land.`,
    'FLAT':         `Cross-train, wax your board, and watch the forecasts. Nothing surfable today.`,
  }

  return summaries[label] ?? `${waves} ${dir} swell — check conditions on arrival.`
}

export default function ForecastGrid({ forecast, units, isCoastal }: Props) {
  const [hoveredDay, setHoveredDay]   = useState<DayForecast | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null)

  const activeDay = hoveredDay ?? selectedDay

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto forecast-scroll -mx-1 px-1">
        <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 pb-1">
          {forecast.map(day => (
            <ForecastCard
              key={day.date}
              day={day}
              units={units}
              isCoastal={isCoastal}
              isSelected={selectedDay?.date === day.date}
              onHover={setHoveredDay}
              onSelect={() => setSelectedDay(prev => prev?.date === day.date ? null : day)}
            />
          ))}
        </div>
      </div>

      {activeDay && (
        <div className="glass-card rounded-xl px-4 py-3 border border-white/8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <p className="text-sm font-semibold text-slate-200">{activeDay.dayName}</p>
            {isCoastal && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: activeDay.rating.bgColor, color: activeDay.rating.textColor }}
              >
                {activeDay.rating.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {generateDaySummary(activeDay, isCoastal, units)}
          </p>
        </div>
      )}
    </div>
  )
}

function ForecastCard({ day, units, isCoastal, isSelected, onHover, onSelect }: {
  day: DayForecast
  units: Props['units']
  isCoastal: boolean
  isSelected: boolean
  onHover: (day: DayForecast | null) => void
  onSelect: () => void
}) {
  const { rating } = day
  const isToday = day.dayName === 'Today'
  const highlighted = isToday || isSelected

  return (
    <div
      className={`
        flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer
        w-[88px] sm:w-auto shrink-0 sm:shrink
        ${highlighted
          ? 'border-sky-500/30 bg-sky-500/5'
          : 'glass-card hover:border-sky-500/30 hover:bg-sky-500/5'
        }
      `}
      onMouseEnter={() => onHover(day)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
    >
      <p className={`text-xs font-semibold truncate ${isToday ? 'text-sky-300' : 'text-slate-400'}`}>
        {day.dayName}
      </p>

      <div className="text-center">
        <WeatherIcon code={day.weatherCode} size={22} />
      </div>

      {isCoastal && (
        <div
          className="text-center text-xs font-bold py-0.5 rounded-md"
          style={{ backgroundColor: rating.bgColor, color: rating.textColor }}
          title={rating.label}
        >
          {rating.label === 'FLAT'         ? '–'      :
           rating.label === 'POOR'         ? '★'      :
           rating.label === 'POOR TO FAIR' ? '★★'     :
           rating.label === 'FAIR'         ? '★★★'    :
           rating.label === 'FAIR TO GOOD' ? '★★★'    :
           rating.label === 'GOOD'         ? '★★★★'   :
           rating.label === 'VERY GOOD'    ? '★★★★'   : '★★★★★'
          }
        </div>
      )}

      {isCoastal && (
        <p className="text-xs font-semibold text-white text-center">
          {formatWaveRange(day.waveHeightMin, day.waveHeightMax, units.height)}
        </p>
      )}

      {isCoastal && (
        <div className="flex items-center gap-1 text-xs text-sky-400/80">
          <SwellIcon />
          <span className="font-medium">{day.swellDirectionLabel}</span>
        </div>
      )}

      <div className="flex justify-between text-xs">
        <span className="text-white font-medium">{formatTemp(day.tempMax, units.temp)}</span>
        <span className="text-slate-500">{formatTemp(day.tempMin, units.temp)}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-400">
        <WindIcon />
        <WindArrow direction={day.windDirectionDominant} />
        <span>{Math.round(day.windSpeedMax)}</span>
      </div>

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

'use client'

import { useState } from 'react'
import type { DayForecast } from '@/app/lib/types'
import { formatWaveRange, formatTemp } from '@/app/lib/utils'
import WeatherIcon from './WeatherIcon'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  forecast: DayForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  isCoastal: boolean
  isPremium?: boolean
  activeDate?: string | null
  onDateSelect?: (date: string | null) => void
}

const RATING_KEY_MAP: Record<string, string> = {
  'EPIC':         'forecast.summaries.EPIC',
  'VERY GOOD':    'forecast.summaries.VERY_GOOD',
  'GOOD':         'forecast.summaries.GOOD',
  'FAIR TO GOOD': 'forecast.summaries.FAIR_TO_GOOD',
  'FAIR':         'forecast.summaries.FAIR',
  'POOR TO FAIR': 'forecast.summaries.POOR_TO_FAIR',
  'POOR':         'forecast.summaries.POOR',
  'FLAT':         'forecast.summaries.FLAT',
}

function localDayName(day: DayForecast, locale: string, t: TFn): string {
  if (day.dayName === 'Today') return t('day.today')
  if (day.dayName === 'Tomorrow') return t('day.tomorrow')
  const [year, month, d] = day.date.split('-').map(Number)
  return new Date(year, month - 1, d).toLocaleDateString(locale, { weekday: 'short' })
}

function generateDaySummary(day: DayForecast, isCoastal: boolean, units: Props['units'], t: TFn): string {
  if (!isCoastal) {
    const hi     = formatTemp(day.tempMax, units.temp)
    const lo     = formatTemp(day.tempMin, units.temp)
    const wind   = Math.round(day.windSpeedMax)
    const precip = day.precipProbabilityMax > 30
      ? t('forecast.precipChance', { pct: day.precipProbabilityMax })
      : ''
    return t('forecast.nonCoastal', { hi, lo, wind, dir: t('dir.' + day.windDirectionLabel), precip })
  }

  const waves  = formatWaveRange(day.waveHeightMin, day.waveHeightMax, units.height)
  const dir    = t('dir.' + day.swellDirectionLabel)
  const period = day.wavePeriodMax
  const label  = day.rating.label
  const key    = RATING_KEY_MAP[label] ?? 'forecast.summaries.fallback'
  return t(key, { waves, dir, period })
}

export default function ForecastGrid({ forecast, units, isCoastal, isPremium, activeDate, onDateSelect }: Props) {
  const { t, locale } = useLanguage()
  const [hoveredDay, setHoveredDay] = useState<DayForecast | null>(null)

  const selectedDay = activeDate ? (forecast.find(d => d.date === activeDate) ?? null) : null
  const activeDay   = hoveredDay ?? selectedDay
  const baseDays     = forecast.slice(0, 10)
  const extendedDays = forecast.slice(10)

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto forecast-scroll -mx-1 px-1">
        <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 pb-1">
          {baseDays.map(day => (
            <ForecastCard
              key={day.date}
              day={day}
              units={units}
              isCoastal={isCoastal}
              isSelected={activeDate === day.date}
              onHover={setHoveredDay}
              onSelect={() => onDateSelect?.(activeDate === day.date ? null : day.date)}
            />
          ))}
        </div>
      </div>

      {isPremium && extendedDays.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400/70 px-1">
              {t('forecast.extendedLabel')}
            </span>
            <div className="h-px flex-1 bg-white/6" />
          </div>
          <div className="overflow-x-auto forecast-scroll -mx-1 px-1">
            <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-6 pb-1">
              {extendedDays.map(day => (
                <ForecastCard
                  key={day.date}
                  day={day}
                  units={units}
                  isCoastal={isCoastal}
                  isSelected={activeDate === day.date}
                  onHover={setHoveredDay}
                  onSelect={() => onDateSelect?.(activeDate === day.date ? null : day.date)}
                  dimmed
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl px-4 py-3 border border-white/8">
        <div className="grid">
          {/* Invisible sizing ghosts — one per day, all stacked in the same grid cell.
              The tallest summary determines the container height; it never changes. */}
          {[...baseDays, ...extendedDays].map(day => (
            <div key={day.date} className="col-start-1 row-start-1 invisible pointer-events-none" aria-hidden="true">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <p className="text-sm font-semibold">&nbsp;</p>
                {isCoastal && <span className="text-[10px]">&nbsp;</span>}
              </div>
              <p className="text-xs leading-relaxed">
                {generateDaySummary(day, isCoastal, units, t)}
              </p>
            </div>
          ))}

          {/* Visible content — same grid cell, rendered on top */}
          <div className="col-start-1 row-start-1 flex flex-col">
            {activeDay ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-semibold text-slate-200">{localDayName(activeDay, locale, t)}</p>
                  {isCoastal && (
                    <span
                      className="rating-chip text-[10px] font-bold px-2 py-0.5 rounded"
                      data-rating={activeDay.rating.label.replace(/ /g, '_')}
                      style={{ backgroundColor: activeDay.rating.bgColor }}
                    >
                      {t('rating.' + activeDay.rating.label.replace(/ /g, '_'))}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {generateDaySummary(activeDay, isCoastal, units, t)}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-600 text-center leading-relaxed my-auto">
                {t('forecast.hoverPrompt')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ForecastCard({ day, units, isCoastal, isSelected, onHover, onSelect, dimmed }: {
  day: DayForecast
  units: Props['units']
  isCoastal: boolean
  isSelected: boolean
  onHover: (day: DayForecast | null) => void
  onSelect: () => void
  dimmed?: boolean
}) {
  const { t, locale } = useLanguage()
  const { rating } = day
  const isToday = day.dayName === 'Today'
  const highlighted = isToday || isSelected

  return (
    <div
      className={`
        flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer
        w-[88px] sm:w-auto shrink-0 sm:shrink
        ${dimmed ? 'opacity-75' : ''}
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
        {localDayName(day, locale, t)}
      </p>

      <div className="text-center">
        <WeatherIcon code={day.weatherCode} size={22} />
      </div>

      {isCoastal && (
        <div
          className="text-center text-xs font-bold py-0.5 rounded-md"
          style={{ backgroundColor: rating.bgColor, color: rating.textColor }}
          title={t('rating.' + rating.label.replace(/ /g, '_'))}
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
          <span className="font-medium">{t('dir.' + day.swellDirectionLabel)}</span>
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

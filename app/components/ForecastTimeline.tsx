'use client'

import { useState } from 'react'
import type { DayForecast } from '@/app/lib/types'
import { formatWaveRange } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  forecast: DayForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

const COL_W = 60

const RATING_KEY: Record<string, string> = {
  'FLAT':         'rating.FLAT',
  'POOR':         'rating.POOR',
  'POOR TO FAIR': 'rating.POOR_TO_FAIR',
  'FAIR':         'rating.FAIR',
  'FAIR TO GOOD': 'rating.FAIR_TO_GOOD',
  'GOOD':         'rating.GOOD',
  'VERY GOOD':    'rating.VERY_GOOD',
  'EPIC':         'rating.EPIC',
}

function shortDayLabel(day: DayForecast, locale: string, t: TFn): string {
  if (day.dayName === 'Today')    return t('day.today')
  if (day.dayName === 'Tomorrow') return t('day.tomorrow')
  const [year, month, d] = day.date.split('-').map(Number)
  return new Date(year, month - 1, d).toLocaleDateString(locale, { weekday: 'short' })
}

function shortDate(date: string): string {
  const [, m, d] = date.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}

export default function ForecastTimeline({ forecast, units }: Props) {
  const { t, locale } = useLanguage()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (forecast.length === 0) return null

  const activeIdx = hoveredIdx ?? 0
  const active    = forecast[activeIdx]
  const marineMax = Math.max(...forecast.map(d => d.hasMarineData ? d.waveHeightMax : 0), 0.5)

  return (
    <div className="mb-5">

      {/* ── Scrollable rows ──────────────────────────────────────── */}
      <div className="overflow-x-auto forecast-scroll -mx-2 px-2 pb-1">
        <div style={{ minWidth: forecast.length * COL_W }}>

          {/* Row 1: day labels */}
          <div className="flex mb-1">
            {forecast.map((day, i) => {
              const isToday  = day.dayName === 'Today'
              const isActive = i === activeIdx
              return (
                <div
                  key={day.date}
                  style={{ width: COL_W }}
                  className={`flex-shrink-0 text-center py-1 cursor-pointer rounded-t transition-colors ${
                    isActive ? 'bg-white/5' : ''
                  }`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <p className={`text-[10px] font-semibold leading-tight truncate ${
                    isToday ? 'text-sky-400' : 'text-slate-400'
                  }`}>
                    {shortDayLabel(day, locale, t)}
                  </p>
                  <p className="text-[9px] text-slate-600 leading-tight">{shortDate(day.date)}</p>
                </div>
              )
            })}
          </div>

          {/* Row 2: rating color bar */}
          <div className="flex h-[18px] rounded-lg overflow-hidden mb-1">
            {forecast.map((day, i) => {
              const isActive = i === activeIdx
              return (
                <div
                  key={day.date}
                  className="flex-shrink-0 cursor-pointer transition-opacity duration-150"
                  style={{
                    width: COL_W,
                    backgroundColor: day.hasMarineData
                      ? day.rating.color
                      : 'rgba(100,116,139,0.15)',
                    opacity: hoveredIdx !== null && !isActive ? 0.45 : 1,
                    borderRight: i < forecast.length - 1 ? '1px solid rgba(0,0,0,0.2)' : undefined,
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              )
            })}
          </div>

          {/* Row 3: wave height bar chart */}
          <div className="flex items-end" style={{ height: 64 }}>
            {forecast.map((day, i) => {
              const isActive = i === activeIdx
              const pct  = day.hasMarineData ? day.waveHeightMax / marineMax : 0
              const barH = Math.max(Math.round(pct * 50), day.hasMarineData ? 3 : 0)
              return (
                <div
                  key={day.date}
                  style={{ width: COL_W }}
                  className="flex-shrink-0 flex flex-col items-center justify-end px-1 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {day.hasMarineData && (
                    <p className={`text-[9px] leading-tight mb-0.5 transition-colors truncate ${
                      isActive ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {formatWaveRange(day.waveHeightMin, day.waveHeightMax, units.height)}
                    </p>
                  )}
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: barH,
                      backgroundColor: day.hasMarineData
                        ? day.rating.color
                        : 'rgba(100,116,139,0.08)',
                      opacity: isActive ? 0.9 : 0.35,
                      transition: 'opacity 0.15s',
                    }}
                  />
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* ── Info panel (outside scroll — never clips) ──────────── */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 min-h-[28px]">
        {active.hasMarineData ? (
          <>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
              style={{ backgroundColor: active.rating.bgColor, color: active.rating.textColor }}
            >
              {t(RATING_KEY[active.rating.label] ?? 'rating.FLAT')}
            </span>

            <span className="text-sm font-semibold text-white shrink-0">
              {formatWaveRange(active.waveHeightMin, active.waveHeightMax, units.height)}
            </span>

            <span className="hidden sm:block text-white/15 shrink-0">|</span>

            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <SwellIcon />
              {t('dir.' + active.swellDirectionLabel)}
              {' · '}{Math.round(active.wavePeriodMax)}s
            </span>

            <span className="hidden sm:block text-white/15 shrink-0">|</span>

            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <WindIcon />
              {t('dir.' + active.windDirectionLabel)}
              {' · '}{Math.round(active.windSpeedMax)} km/h
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-600 italic">
            {shortDayLabel(active, locale, t)} · {t('forecast.extendedLabel')}
          </span>
        )}
      </div>
    </div>
  )
}

function SwellIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path
        d="M0.5 5.5 C1.5 3.5, 2.5 3.5, 3.5 5.5 C4.5 7.5, 5.5 7.5, 6.5 5.5 C7.5 3.5, 8.5 3.5, 9.5 5.5 C10 6.5, 10.5 6.5, 11.5 5.5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  )
}

function WindIcon() {
  return (
    <svg width="11" height="10" viewBox="0 0 11 10" fill="none" aria-hidden>
      <path d="M1 2.5h6.5a1.25 1.25 0 0 1 0 2.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1 6.5h4a1 1 0 0 1 0 2H1"           stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

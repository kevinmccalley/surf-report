'use client'

import { useState, useMemo } from 'react'
import type { DayForecast, HourlyForecast } from '@/app/lib/types'
import { formatWaveHeight, getDirectionLabel } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  forecast: DayForecast[]
  hourly:   HourlyForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

const HOUR_W   = 12
const DAY_W    = HOUR_W * 24   // 288px — 4 days fit on a ~1150px widescreen
const BAR_H    = 60
const BUBBLE_H = 34
const BUBBLE_W = 280           // conservative width for left-edge clamping

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

const TICK_LABELS: Record<number, string> = { 0: '12a', 6: '6a', 12: '12p', 18: '6p' }

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

function hourLabel(timeStr: string): string {
  const h = parseInt(timeStr.slice(11, 13), 10)
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export default function ForecastTimeline({ forecast, hourly, units }: Props) {
  const { t, locale } = useLanguage()
  const [hovered, setHovered] = useState<{ di: number; hi: number; hour: HourlyForecast } | null>(null)

  const hourlyByDay = useMemo(() => {
    const map = new Map<string, (HourlyForecast | null)[]>()
    for (const h of hourly) {
      const date = h.time.slice(0, 10)
      if (!map.has(date)) map.set(date, Array(24).fill(null))
      const hi = parseInt(h.time.slice(11, 13), 10)
      if (hi >= 0 && hi < 24) map.get(date)![hi] = h
    }
    return map
  }, [hourly])

  const days = forecast.filter(d => hourlyByDay.has(d.date))
  if (days.length === 0) return null

  const maxWave = Math.max(...hourly.map(h => h.waveHeight), 0.5)
  const totalW  = days.length * DAY_W

  // Default: noon of first day (or first available hour)
  const defaultDayHours = hourlyByDay.get(days[0].date) ?? []
  const defaultHi       = 12
  const defaultHour     = defaultDayHours[12] ?? defaultDayHours.find(h => h !== null) ?? null

  const activeDi   = hovered?.di   ?? 0
  const activeHi   = hovered?.hi   ?? defaultHi
  const activeHour = hovered?.hour  ?? defaultHour
  const activeDay  = days[activeDi]

  // Cursor x-center within the full scrollable width
  const cursorX    = activeDi * DAY_W + activeHi * HOUR_W + HOUR_W / 2
  // Clamp bubble so it never overflows the scroll content
  const bubbleLeft = Math.max(0, Math.min(cursorX - BUBBLE_W / 2, totalW - BUBBLE_W))

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
        {t('timeline.title')}
      </h2>

      <div className="overflow-x-auto forecast-scroll -mx-2 px-2 pb-1">
        <div style={{ minWidth: totalW }}>

          {/* Row 1 — Day headers */}
          <div className="flex mb-1">
            {days.map(day => (
              <div
                key={day.date}
                style={{ width: DAY_W }}
                className="flex-shrink-0 border-r border-white/5 last:border-r-0 pl-1"
              >
                <p className={`text-[10px] font-semibold leading-tight truncate ${
                  day.dayName === 'Today' ? 'text-sky-400' : 'text-slate-400'
                }`}>
                  {shortDayLabel(day, locale, t)}
                </p>
                <p className="text-[9px] text-slate-600 leading-tight">{shortDate(day.date)}</p>
              </div>
            ))}
          </div>

          {/* Rows 2+3 — sliding bubble + bar chart
              Combined in one relative container so the cursor line spans both */}
          <div className="relative" style={{ height: BUBBLE_H + BAR_H }}>

            {/* Cursor line — spans full height of bubble + bars */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none z-10"
              style={{ left: cursorX }}
            />

            {/* Sliding info bubble */}
            <div
              className="absolute top-0 z-20 pointer-events-none flex items-center"
              style={{ left: bubbleLeft, height: BUBBLE_H }}
            >
              {activeDay && activeHour && (
                <div className="flex items-center gap-1.5 bg-slate-950/95 border border-white/10 rounded-full px-2.5 py-1 shadow-lg backdrop-blur-sm whitespace-nowrap">
                  <span className="text-[9px] text-slate-500 tabular-nums">
                    {shortDayLabel(activeDay, locale, t)} · {hourLabel(activeHour.time)}
                  </span>

                  {activeDay.hasMarineData && (
                    <span
                      className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: activeDay.rating.bgColor, color: activeDay.rating.textColor }}
                    >
                      {t(RATING_KEY[activeDay.rating.label] ?? 'rating.FLAT')}
                    </span>
                  )}

                  <span className="text-[10px] font-semibold text-white">
                    {formatWaveHeight(activeHour.waveHeight, units.height)}
                  </span>

                  {activeHour.swellHeight > 0 && (
                    <>
                      <span className="text-white/15">|</span>
                      <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                        <SwellIcon />
                        {t('dir.' + getDirectionLabel(activeHour.swellDirection))}
                        {activeHour.swellPeriod > 0 && ` ${Math.round(activeHour.swellPeriod)}s`}
                      </span>
                    </>
                  )}

                  <span className="text-white/15">|</span>

                  <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                    <WindIcon />
                    {t('dir.' + getDirectionLabel(activeHour.windDirection))}
                    {' '}{Math.round(activeHour.windSpeed)} km/h
                  </span>
                </div>
              )}
            </div>

            {/* Bar chart — positioned below the bubble row */}
            <div
              className="absolute left-0 flex items-end"
              style={{ top: BUBBLE_H, height: BAR_H, width: totalW }}
            >
              {days.map((day, di) => {
                const hours = hourlyByDay.get(day.date) ?? Array(24).fill(null)
                return (
                  <div
                    key={day.date}
                    style={{ width: DAY_W }}
                    className="flex-shrink-0 flex items-end h-full border-r border-white/5 last:border-r-0"
                  >
                    {hours.map((h, hi) => {
                      const wh   = h?.waveHeight ?? 0
                      const barH = Math.max(Math.round((wh / maxWave) * (BAR_H - 4)), wh > 0 ? 2 : 0)
                      const isActive = hovered?.di === di && hovered?.hi === hi
                      const isDimmed = hovered !== null && !isActive
                      return (
                        <div
                          key={hi}
                          style={{ width: HOUR_W, height: '100%' }}
                          className="flex-shrink-0 flex items-end cursor-crosshair"
                          onMouseEnter={() => h && setHovered({ di, hi, hour: h })}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <div
                            style={{
                              height: barH,
                              width: HOUR_W - 1,
                              backgroundColor: day.hasMarineData && wh > 0
                                ? day.rating.color
                                : 'rgba(100,116,139,0.08)',
                              opacity: isActive ? 1 : isDimmed ? 0.3 : 0.55,
                              transition: 'opacity 0.08s',
                            }}
                            className="rounded-t-[1px]"
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

          </div>

          {/* Row 4 — Hour ticks + time labels */}
          <div className="flex">
            {days.map(day => (
              <div
                key={day.date}
                style={{ width: DAY_W }}
                className="flex-shrink-0 relative h-[20px] border-r border-white/5 last:border-r-0"
              >
                {Array.from({ length: 25 }, (_, hi) => (
                  <div
                    key={hi}
                    style={{ left: hi * HOUR_W }}
                    className={`absolute top-0 w-px ${
                      hi % 6 === 0
                        ? 'h-[10px] bg-white/20'
                        : hi % 3 === 0
                          ? 'h-[6px] bg-white/10'
                          : 'h-[4px] bg-white/6'
                    }`}
                  />
                ))}
                {([0, 6, 12, 18] as const).map(hi => (
                  <span
                    key={hi}
                    style={{ left: hi * HOUR_W }}
                    className="absolute top-[11px] text-[8px] text-slate-600 -translate-x-1/2 select-none"
                  >
                    {TICK_LABELS[hi]}
                  </span>
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

function SwellIcon() {
  return (
    <svg width="10" height="7" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path
        d="M0.5 5.5 C1.5 3.5, 2.5 3.5, 3.5 5.5 C4.5 7.5, 5.5 7.5, 6.5 5.5 C7.5 3.5, 8.5 3.5, 9.5 5.5 C10 6.5, 10.5 6.5, 11.5 5.5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  )
}

function WindIcon() {
  return (
    <svg width="10" height="9" viewBox="0 0 11 10" fill="none" aria-hidden>
      <path d="M1 2.5h6.5a1.25 1.25 0 0 1 0 2.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1 6.5h4a1 1 0 0 1 0 2H1"           stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

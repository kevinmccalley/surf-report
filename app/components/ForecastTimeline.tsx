'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { DayForecast, HourlyForecast } from '@/app/lib/types'
import { formatWaveHeight, getDirectionLabel } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  forecast: DayForecast[]
  hourly:   HourlyForecast[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

const HOUR_W = 12
const DAY_W  = HOUR_W * 24   // 288px — 4 days visible on a ~1150px widescreen
const BAR_H  = 64

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

  // Two synced scroll panes so the pill track can sit between them
  const topRef  = useRef<HTMLDivElement>(null)   // day-label pane
  const botRef  = useRef<HTMLDivElement>(null)   // bar-chart pane
  const syncing = useRef(false)

  const [scrollLeft,   setScrollLeft]   = useState(0)
  const [visibleWidth, setVisibleWidth] = useState(0)
  const [hoveredBar,   setHoveredBar]   = useState<{ di: number; hi: number; hour: HourlyForecast } | null>(null)

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

  const maxWave = Math.max(...hourly.map(h => h.waveHeight), 0.5)
  const totalW  = days.length * DAY_W

  // Measure scroll viewport width (same for both panes)
  useEffect(() => {
    const el = botRef.current
    if (!el) return
    const update = () => setVisibleWidth(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep both panes in sync when either is scrolled natively
  const handlePaneScroll = (src: 'top' | 'bot') => {
    if (syncing.current) return
    const ref = src === 'top' ? topRef : botRef
    const sl  = ref.current?.scrollLeft ?? 0
    setScrollLeft(sl)
    syncing.current = true
    const other = src === 'top' ? botRef : topRef
    if (other.current) other.current.scrollLeft = sl
    setTimeout(() => { syncing.current = false }, 0)
  }

  // Pill geometry (proportional scrollbar)
  const pillW    = visibleWidth > 0
    ? Math.max(120, Math.round((visibleWidth / totalW) * visibleWidth))
    : 120
  const maxSl    = Math.max(0, totalW - visibleWidth)
  const trackUse = Math.max(0, visibleWidth - pillW)
  const pillL    = maxSl > 0 ? Math.round((scrollLeft / maxSl) * trackUse) : 0

  // Drag the pill to scroll both panes
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX    = e.clientX
    const startSl   = scrollLeft

    const onMove = (me: MouseEvent) => {
      const dx    = me.clientX - startX
      const newSl = trackUse > 0
        ? Math.max(0, Math.min(startSl + (dx / trackUse) * maxSl, maxSl))
        : 0
      syncing.current = true
      if (topRef.current) topRef.current.scrollLeft = newSl
      if (botRef.current) botRef.current.scrollLeft = newSl
      setScrollLeft(newSl)
      setTimeout(() => { syncing.current = false }, 0)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Active info: hovered bar takes priority, otherwise use center of viewport
  const getViewportHour = (): { hour: HourlyForecast | null; day: DayForecast | null } => {
    if (days.length === 0) return { hour: null, day: null }
    const centerX = scrollLeft + Math.max(visibleWidth / 2, 0)
    const di = Math.max(0, Math.min(Math.floor(centerX / DAY_W), days.length - 1))
    const hi = Math.max(0, Math.min(Math.floor((centerX % DAY_W) / HOUR_W), 23))
    const hours = hourlyByDay.get(days[di]?.date ?? '') ?? []
    return { hour: hours[hi] ?? null, day: days[di] ?? null }
  }

  const { hour: vpHour, day: vpDay } = getViewportHour()
  const activeHour = hoveredBar?.hour ?? vpHour
  const activeDay  = hoveredBar ? (days[hoveredBar.di] ?? null) : vpDay

  if (days.length === 0) return null

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
        {t('timeline.title')}
      </h2>

      {/* ── TOP PANE: day labels ──────────────────────────────────── */}
      <div
        ref={topRef}
        className="overflow-x-auto forecast-scroll -mx-2 px-2"
        style={{ scrollbarWidth: 'none' }}
        onScroll={() => handlePaneScroll('top')}
      >
        <div style={{ minWidth: totalW }} className="flex">
          {days.map(day => (
            <div
              key={day.date}
              style={{ width: DAY_W }}
              className="flex-shrink-0 border-r border-white/5 last:border-r-0 pl-1 pb-1"
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
      </div>

      {/* ── PILL TRACK: draggable scrollbar between the two panes ── */}
      <div className="relative h-9 my-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {/* Pill */}
        <div
          className="absolute top-0 bottom-0 rounded-xl bg-white/[0.07] border border-white/10
                     cursor-grab active:cursor-grabbing select-none
                     flex items-center overflow-hidden"
          style={{ left: pillL, width: pillW }}
          onMouseDown={startDrag}
        >
          {activeHour && activeDay ? (
            <div className="flex items-center gap-2 px-3 whitespace-nowrap min-w-0 overflow-hidden">
              {/* Time */}
              <span className="text-[9px] text-slate-400 tabular-nums shrink-0">
                {shortDayLabel(activeDay, locale, t)} · {hourLabel(activeHour.time)}
              </span>

              {/* Rating chip */}
              {activeDay.hasMarineData && (
                <span
                  className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeDay.rating.bgColor, color: activeDay.rating.textColor }}
                >
                  {t(RATING_KEY[activeDay.rating.label] ?? 'rating.FLAT')}
                </span>
              )}

              {/* Wave height */}
              <span className="text-[10px] font-semibold text-slate-200 shrink-0">
                {formatWaveHeight(activeHour.waveHeight, units.height)}
              </span>

              {/* Swell */}
              {activeHour.swellHeight > 0 && (
                <>
                  <span className="text-white/15 shrink-0">|</span>
                  <span className="flex items-center gap-0.5 text-[9px] text-slate-500 shrink-0">
                    <SwellIcon />
                    {t('dir.' + getDirectionLabel(activeHour.swellDirection))}
                    {activeHour.swellPeriod > 0 && ` ${Math.round(activeHour.swellPeriod)}s`}
                  </span>
                </>
              )}

              {/* Wind */}
              <span className="text-white/15 shrink-0">|</span>
              <span className="flex items-center gap-0.5 text-[9px] text-slate-500 shrink-0">
                <WindIcon />
                {t('dir.' + getDirectionLabel(activeHour.windDirection))}
                {' '}{Math.round(activeHour.windSpeed)} km/h
              </span>
            </div>
          ) : (
            <div className="px-3">
              <span className="text-[9px] text-slate-600">—</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM PANE: bar chart + ticks ───────────────────────── */}
      <div
        ref={botRef}
        className="overflow-x-auto forecast-scroll -mx-2 px-2"
        style={{ scrollbarWidth: 'none' }}
        onScroll={() => handlePaneScroll('bot')}
      >
        <div style={{ minWidth: totalW }}>

          {/* Wave height bars */}
          <div className="flex" style={{ height: BAR_H }}>
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
                    const isActive = hoveredBar?.di === di && hoveredBar?.hi === hi
                    const isDimmed = hoveredBar !== null && !isActive
                    return (
                      <div
                        key={hi}
                        style={{ width: HOUR_W, height: '100%' }}
                        className="flex-shrink-0 flex items-end cursor-crosshair"
                        onMouseEnter={() => h && setHoveredBar({ di, hi, hour: h })}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div
                          style={{
                            height: barH,
                            width: HOUR_W - 1,
                            backgroundColor: day.hasMarineData && wh > 0
                              ? day.rating.color
                              : 'rgba(100,116,139,0.08)',
                            opacity: isActive ? 1 : isDimmed ? 0.25 : 0.5,
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

          {/* Hour ticks + labels */}
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

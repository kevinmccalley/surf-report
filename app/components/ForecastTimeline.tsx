'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { DayForecast, HourlyForecast } from '@/app/lib/types'
import { formatWaveHeight, getDirectionLabel } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  forecast:    DayForecast[]
  hourly:      HourlyForecast[]
  units:       { temp: 'c' | 'f'; height: 'ft' | 'm' }
  tideHourly?: { time: string; height: number }[]
}

const HOUR_W = 12
const DAY_W  = HOUR_W * 24   // 288px — 4 days on a ~1150px widescreen
const WAVE_H = 56
const WIND_H = 36
const TIDE_H = 36
const TICK_H = 20
const ICON_W = 20            // icon column width (px)

function windColor(kmh: number): string {
  if (kmh < 10) return 'rgba(148,163,184,0.15)'
  if (kmh < 20) return 'rgba(56,189,248,0.50)'
  if (kmh < 35) return 'rgba(250,204,21,0.60)'
  if (kmh < 50) return 'rgba(249,115,22,0.75)'
  return              'rgba(239,68,68,0.85)'
}

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

// Best-effort: extract "YYYY-MM-DD|HH" regardless of T/space separator or timezone suffix
function tideKey(time: string): string {
  const m = time.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}):/)
  return m ? `${m[1]}|${m[2]}` : time
}

export default function ForecastTimeline({ forecast, hourly, units, tideHourly }: Props) {
  const { t, locale } = useLanguage()

  const topRef     = useRef<HTMLDivElement>(null)   // day-label scroll pane
  const botRef     = useRef<HTMLDivElement>(null)   // bar-chart scroll pane
  const topAreaRef = useRef<HTMLDivElement>(null)   // labels + pill — measured for icon alignment
  const syncing    = useRef(false)

  const [scrollLeft,   setScrollLeft]   = useState(0)
  const [visibleWidth, setVisibleWidth] = useState(0)
  const [topOffset,    setTopOffset]    = useState(80)  // initial guess; replaced after mount
  const [hoveredBar,   setHoveredBar]   = useState<{ di: number; hi: number; hour: HourlyForecast } | null>(null)

  // ── Data grouping ───────────────────────────────────────────────
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

  const tideByKey = useMemo(() => {
    if (!tideHourly?.length) return null
    const map = new Map<string, number>()
    for (const th of tideHourly) {
      // Primary: direct slice — handles "YYYY-MM-DD HH:MM", "YYYY-MM-DDTHH:MM", ISO-Z variants
      const date = th.time.slice(0, 10)
      const hour = th.time.slice(11, 13)
      if (date && hour) map.set(`${date}|${hour}`, th.height)
      // Belt-and-suspenders: regex key for any unusual format
      const rk = tideKey(th.time)
      if (!map.has(rk)) map.set(rk, th.height)
    }
    return map
  }, [tideHourly])

  const days    = forecast.filter(d => hourlyByDay.has(d.date))
  const totalW  = days.length * DAY_W
  const maxWave = Math.max(...hourly.map(h => h.waveHeight), 0.5)
  const maxWind = Math.max(...hourly.map(h => h.windSpeed),  1)

  const tideVals  = tideHourly?.map(t => t.height) ?? []
  const tideMin   = tideVals.length ? Math.min(...tideVals) : 0
  const tideRange = tideVals.length ? Math.max(Math.max(...tideVals) - tideMin, 0.1) : 1
  const showTide  = (tideByKey?.size ?? 0) > 0

  // ── Measurements ────────────────────────────────────────────────
  useEffect(() => {
    const el = botRef.current
    if (!el) return
    const update = () => setVisibleWidth(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = topAreaRef.current
    if (!el) return
    const update = () => setTopOffset(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Scroll sync ─────────────────────────────────────────────────
  const handlePaneScroll = (src: 'top' | 'bot') => {
    if (syncing.current) return
    const sl = (src === 'top' ? topRef : botRef).current?.scrollLeft ?? 0
    setScrollLeft(sl)
    syncing.current = true
    const other = src === 'top' ? botRef : topRef
    if (other.current) other.current.scrollLeft = sl
    setTimeout(() => { syncing.current = false }, 0)
  }

  // ── Pill geometry ───────────────────────────────────────────────
  // Desktop: 420px floor so translations have room for all data fields.
  // Mobile: cap at 55% of visible width so at least 45% remains as drag track.
  const isMobile = visibleWidth > 0 && visibleWidth < 640
  const pillMinW = isMobile
    ? Math.round(visibleWidth * 0.55)
    : 420
  const pillW    = visibleWidth > 0
    ? Math.max(pillMinW, Math.round((visibleWidth / Math.max(totalW, 1)) * visibleWidth))
    : pillMinW
  const maxSl    = Math.max(0, totalW - visibleWidth)
  const trackUse = Math.max(0, visibleWidth - pillW)
  const pillL    = maxSl > 0 ? Math.round((scrollLeft / maxSl) * trackUse) : 0

  // ── Drag pill (mouse + touch) ────────────────────────────────────
  const applyDrag = (clientX: number, startX: number, startSl: number) => {
    const newSl = trackUse > 0
      ? Math.max(0, Math.min(startSl + ((clientX - startX) / trackUse) * maxSl, maxSl))
      : 0
    syncing.current = true
    if (topRef.current) topRef.current.scrollLeft = newSl
    if (botRef.current) botRef.current.scrollLeft = newSl
    setScrollLeft(newSl)
    setTimeout(() => { syncing.current = false }, 0)
  }

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX  = e.clientX
    const startSl = scrollLeft
    const onMove  = (me: MouseEvent) => applyDrag(me.clientX, startX, startSl)
    const onUp    = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const startTouchDrag = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    const startX  = touch.clientX
    const startSl = scrollLeft
    const onMove  = (te: TouchEvent) => {
      if (te.touches[0]) {
        te.preventDefault()
        applyDrag(te.touches[0].clientX, startX, startSl)
      }
    }
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  // ── Active info ─────────────────────────────────────────────────
  const getViewportInfo = (): { hour: HourlyForecast | null; day: DayForecast | null } => {
    if (!days.length) return { hour: null, day: null }
    const cx = scrollLeft + visibleWidth / 2
    const di = Math.max(0, Math.min(Math.floor(cx / DAY_W), days.length - 1))
    const hi = Math.max(0, Math.min(Math.floor((cx % DAY_W) / HOUR_W), 23))
    return {
      hour: (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi] ?? null,
      day:  days[di] ?? null,
    }
  }
  const { hour: vpHour, day: vpDay } = getViewportInfo()
  const activeHour = hoveredBar?.hour ?? vpHour
  const activeDay  = hoveredBar ? (days[hoveredBar.di] ?? null) : vpDay
  // Direct slice is more robust than regex — Open-Meteo times are always "YYYY-MM-DDTHH:MM"
  const activeTide = (showTide && tideByKey && activeHour) ? (() => {
    const date = activeHour.time.slice(0, 10)
    const hour = activeHour.time.slice(11, 13)
    return tideByKey.get(`${date}|${hour}`)
  })() : undefined

  if (!days.length) return null

  // ── Bar renderer (reused for wave / wind / tide) ─────────────
  const barRow = (
    rowH: number,
    getBarH:   (di: number, hi: number) => number,
    getColor:  (di: number, hi: number) => string,
    getOpacity:(di: number, hi: number) => number,
    getLabel?: (di: number, hi: number) => string | undefined,
  ) => {
    // Hover-value chip: floats just above the hovered bar
    const chip = hoveredBar && getLabel ? (() => {
      const label = getLabel(hoveredBar.di, hoveredBar.hi)
      if (!label) return null
      const barH = getBarH(hoveredBar.di, hoveredBar.hi)
      const x    = hoveredBar.di * DAY_W + hoveredBar.hi * HOUR_W + HOUR_W / 2
      return (
        <div
          className="pointer-events-none"
          style={{
            position:        'absolute',
            bottom:          Math.max(0, barH) + 4,
            left:            x,
            transform:       'translateX(-50%)',
            zIndex:          20,
            background:      'var(--panel-bg)',
            border:          '1px solid var(--card-border)',
            borderRadius:    4,
            padding:         '1px 5px',
            fontSize:        10,
            fontWeight:      600,
            color:           'var(--text-base)',
            whiteSpace:      'nowrap',
            backdropFilter:        'blur(6px)',
            WebkitBackdropFilter:  'blur(6px)',
          }}
        >
          {label}
        </div>
      )
    })() : null

    return (
      <div className="relative flex" style={{ height: rowH }}>
        {days.map((day, di) => {
          const hours = hourlyByDay.get(day.date) ?? Array(24).fill(null)
          return (
            <div key={day.date} style={{ width: DAY_W }}
                 className="flex-shrink-0 flex items-end h-full border-r border-white/5 last:border-r-0">
              {hours.map((h, hi) => (
                <div key={hi} style={{ width: HOUR_W, height: '100%' }}
                     className="flex-shrink-0 flex items-end cursor-crosshair"
                     onMouseEnter={() => h && setHoveredBar({ di, hi, hour: h })}
                     onMouseLeave={() => setHoveredBar(null)}>
                  <div style={{
                    height: getBarH(di, hi),
                    width:  HOUR_W - 1,
                    backgroundColor: getColor(di, hi),
                    opacity: getOpacity(di, hi),
                    transition: 'opacity 0.08s',
                  }} className="rounded-t-[1px]" />
                </div>
              ))}
            </div>
          )
        })}
        {chip}
      </div>
    )
  }

  const barOpacity = (di: number, hi: number) => {
    const isActive = hoveredBar?.di === di && hoveredBar?.hi === hi
    return isActive ? 1 : hoveredBar ? 0.25 : 0.55
  }

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
        {t('timeline.title')}
      </h2>

      <div className="flex" style={{ gap: 6 }}>

        {/* ── Icon column (fixed, not scrolled) ─────────── */}
        {/* align-self: flex-start prevents the outer row from stretching this
            column to the scroll column's full height, which was causing the
            grid centering to fail. A spacer replaces the old marginTop. */}
        <div className="shrink-0 flex flex-col" style={{ width: ICON_W, alignSelf: 'flex-start' }}>
          <div style={{ height: topOffset }} />
          {/* Fixed-pixel offsets: % top fails on flex items (resolves to 0).
              top = (rowH - svgH) / 2, left = (ICON_W - svgW) / 2          */}
          <div style={{ position: 'relative', height: WAVE_H, flexShrink: 0 }} className="text-slate-500">
            <span style={{ position: 'absolute', top: Math.floor((WAVE_H - 10) / 2), left: Math.floor((ICON_W - 16) / 2) }}>
              <WaveRowIcon />
            </span>
          </div>
          <div style={{ position: 'relative', height: WIND_H, flexShrink: 0 }} className="text-slate-500">
            <span style={{ position: 'absolute', top: Math.floor((WIND_H - 12) / 2), left: Math.floor((ICON_W - 15) / 2) }}>
              <WindRowIcon />
            </span>
          </div>
          {showTide && (
            <div style={{ position: 'relative', height: TIDE_H, flexShrink: 0 }} className="text-slate-500">
              <span style={{ position: 'absolute', top: Math.floor((TIDE_H - 14) / 2), left: Math.floor((ICON_W - 14) / 2) }}>
                <TideRowIcon />
              </span>
            </div>
          )}
        </div>

        {/* ── Scroll column ──────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Top area wrapper — measured so icon column aligns correctly */}
          <div ref={topAreaRef}>

            {/* Day-label pane */}
            <div ref={topRef}
                 className="overflow-x-auto"
                 style={{ scrollbarWidth: 'none' }}
                 onScroll={() => handlePaneScroll('top')}>
              <style>{'.tl-pane::-webkit-scrollbar{display:none}'}</style>
              <div style={{ minWidth: totalW }} className="flex tl-pane">
                {days.map(day => (
                  <div key={day.date} style={{ width: DAY_W }}
                       className="flex-shrink-0 border-r border-white/5 last:border-r-0 pl-1 pb-1">
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

            {/* ── Pill track ─────────────────────────────── */}
            <div className="my-1.5" style={{ position: 'relative', height: 36 }}>

              {/* Groove */}
              <div className="absolute inset-0 rounded-full timeline-groove" />

              {/* Draggable pill */}
              <div
                className="timeline-pill absolute top-0 bottom-0 rounded-full flex items-center overflow-hidden
                           cursor-grab active:cursor-grabbing select-none"
                style={{ left: pillL, width: pillW, touchAction: 'none' }}
                onMouseDown={startDrag}
                onTouchStart={startTouchDrag}
              >
                {/* Left chevron */}
                <span className="shrink-0 flex items-center pl-2.5" style={{ color: 'var(--panel-label)' }}>
                  <ChevronLeft />
                </span>

                {/* Info */}
                {activeHour && activeDay ? (
                  <div className="flex-1 flex items-center gap-2 px-1.5 whitespace-nowrap overflow-hidden min-w-0">
                    <span className="text-[10px] tabular-nums shrink-0" style={{ color: 'var(--panel-label)' }}>
                      {shortDayLabel(activeDay, locale, t)} · {hourLabel(activeHour.time)}
                    </span>
                    {activeDay.hasMarineData && (
                      <span className="pill-rating text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: activeDay.rating.bgColor, color: activeDay.rating.color }}>
                        {t(RATING_KEY[activeDay.rating.label] ?? 'rating.FLAT')}
                      </span>
                    )}
                    <span className="text-[12px] font-semibold shrink-0" style={{ color: 'var(--text-base)' }}>
                      {formatWaveHeight(activeHour.waveHeight, units.height)}
                    </span>
                    {activeHour.swellHeight > 0 && (
                      <>
                        <span className="shrink-0 text-[10px]" style={{ color: 'var(--panel-muted)', opacity: 0.5 }}>|</span>
                        <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: 'var(--panel-muted)' }}>
                          <SmallSwellIcon />
                          {t('dir.' + getDirectionLabel(activeHour.swellDirection))}
                          {activeHour.swellPeriod > 0 && ` ${Math.round(activeHour.swellPeriod)}s`}
                        </span>
                      </>
                    )}
                    {activeTide !== undefined && (
                      <>
                        <span className="shrink-0 text-[10px]" style={{ color: 'var(--panel-muted)', opacity: 0.5 }}>|</span>
                        <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: 'var(--panel-muted)' }}>
                          <SmallTideIcon />
                          {formatWaveHeight(activeTide, units.height)}
                        </span>
                      </>
                    )}
                    <span className="shrink-0 text-[10px]" style={{ color: 'var(--panel-muted)', opacity: 0.5 }}>|</span>
                    <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: 'var(--panel-muted)' }}>
                      <SmallWindIcon />
                      {t('dir.' + getDirectionLabel(activeHour.windDirection))}
                      {' '}{Math.round(activeHour.windSpeed)} km/h
                    </span>
                  </div>
                ) : (
                  // Grip pattern when too narrow for text
                  <div className="flex-1 flex items-center justify-center gap-0.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-0.5 h-3.5 rounded-full timeline-grip" />
                    ))}
                  </div>
                )}

                {/* Right chevron */}
                <span className="shrink-0 flex items-center pr-2.5" style={{ color: 'var(--panel-label)' }}>
                  <ChevronRight />
                </span>
              </div>
            </div>

          </div>{/* end topAreaRef */}

          {/* ── Bar-chart pane ─────────────────────────────── */}
          <div ref={botRef}
               className="overflow-x-auto"
               style={{ scrollbarWidth: 'none' }}
               onScroll={() => handlePaneScroll('bot')}>
            <div style={{ minWidth: totalW }}>

              {/* Wave bars */}
              {barRow(
                WAVE_H,
                (di, hi) => {
                  const wh = (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi]?.waveHeight ?? 0
                  return Math.max(Math.round((wh / maxWave) * (WAVE_H - 4)), wh > 0 ? 2 : 0)
                },
                (di, hi) => {
                  const day = days[di]
                  const wh  = (hourlyByDay.get(day?.date ?? '') ?? [])[hi]?.waveHeight ?? 0
                  return day?.hasMarineData && wh > 0 ? day.rating.color : 'rgba(100,116,139,0.08)'
                },
                barOpacity,
                (di, hi) => {
                  const wh = (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi]?.waveHeight
                  return wh ? formatWaveHeight(wh, units.height) : undefined
                },
              )}

              {/* Wind bars */}
              {barRow(
                WIND_H,
                (di, hi) => {
                  const ws = (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi]?.windSpeed ?? 0
                  return Math.max(Math.round((ws / maxWind) * (WIND_H - 4)), ws > 0 ? 2 : 0)
                },
                (di, hi) => {
                  const ws = (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi]?.windSpeed ?? 0
                  return windColor(ws)
                },
                barOpacity,
                (di, hi) => {
                  const h = (hourlyByDay.get(days[di]?.date ?? '') ?? [])[hi]
                  return h ? `${Math.round(h.windSpeed)} km/h` : undefined
                },
              )}

              {/* Tide bars */}
              {showTide && barRow(
                TIDE_H,
                (di, hi) => {
                  const date = days[di]?.date ?? ''
                  const key  = `${date}|${String(hi).padStart(2, '0')}`
                  const h    = tideByKey!.get(key)
                  if (h === undefined) return 0
                  return Math.max(Math.round(((h - tideMin) / tideRange) * (TIDE_H - 4)), 2)
                },
                () => 'rgba(56,189,248,0.45)',
                barOpacity,
                (di, hi) => {
                  const date = days[di]?.date ?? ''
                  const key  = `${date}|${String(hi).padStart(2, '0')}`
                  const h    = tideByKey!.get(key)
                  return h !== undefined ? formatWaveHeight(h, units.height) : undefined
                },
              )}

              {/* Hour ticks + labels */}
              <div className="flex">
                {days.map(day => (
                  <div key={day.date} style={{ width: DAY_W, height: TICK_H }}
                       className="flex-shrink-0 relative border-r border-white/5 last:border-r-0">
                    {Array.from({ length: 25 }, (_, hi) => (
                      <div key={hi} style={{ left: hi * HOUR_W }}
                           className={`absolute top-0 w-px ${
                             hi % 6 === 0 ? 'h-[10px] bg-white/20'
                             : hi % 3 === 0 ? 'h-[6px] bg-white/10'
                             : 'h-[4px] bg-white/6'
                           }`} />
                    ))}
                    {([0, 6, 12, 18] as const).map(hi => (
                      <span key={hi} style={{ left: hi * HOUR_W }}
                            className="absolute top-[11px] text-[8px] text-slate-600 -translate-x-1/2 select-none">
                        {TICK_LABELS[hi]}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>{/* end scroll column */}

      </div>{/* end outer flex */}

    </section>
  )
}

// ── Icons ──────────────────────────────────────────────────────────

function WaveRowIcon() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
      <path d="M0.5 7 C2 4.5, 3.5 4.5, 5 7 C6.5 9.5, 8 9.5, 9.5 7 C11 4.5, 12.5 4.5, 14 7 C14.8 8.3, 15.3 8.3, 15.5 7"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M0.5 3 C2 1.3, 3.5 1.3, 5 3 C6.5 4.7, 8 4.7, 9.5 3"
            stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" opacity="0.45"/>
    </svg>
  )
}

function WindRowIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden>
      <path d="M1 3.5h9a1.75 1.75 0 0 1 0 3.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M1 8.5h5.5a1.25 1.25 0 0 1 0 2.5H1"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function TideRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 9.5 C2.5 7.5, 4 7.5, 5.5 9.5 C7 11.5, 8.5 11.5, 10 9.5 C11 8, 12 8, 13 9.5"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7 7V1.5M7 1.5L5 3.5M7 1.5L9 3.5"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" aria-hidden>
      <path d="M5.5 1L1.5 5.5l4 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" aria-hidden>
      <path d="M1.5 1L5.5 5.5l-4 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SmallSwellIcon() {
  return (
    <svg width="10" height="7" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path d="M0.5 5.5 C1.5 3.5, 2.5 3.5, 3.5 5.5 C4.5 7.5, 5.5 7.5, 6.5 5.5 C7.5 3.5, 8.5 3.5, 9.5 5.5 C10 6.5, 10.5 6.5, 11.5 5.5"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function SmallWindIcon() {
  return (
    <svg width="10" height="9" viewBox="0 0 11 10" fill="none" aria-hidden>
      <path d="M1 2.5h6.5a1.25 1.25 0 0 1 0 2.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M1 6.5h4a1 1 0 0 1 0 2H1"           stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function SmallTideIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 9.5 C2.5 7.5, 4 7.5, 5.5 9.5 C7 11.5, 8.5 11.5, 10 9.5 C11 8, 12 8, 13 9.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 7V1.5M7 1.5L5 3.5M7 1.5L9 3.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

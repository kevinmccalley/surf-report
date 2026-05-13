'use client'

import { useState, useMemo } from 'react'
import type { HourlyForecast, TideReport } from '@/app/lib/types'
import { scoreHours, findBestWindows } from '@/app/lib/session-score'
import type { ScoredHour, SessionWindow } from '@/app/lib/session-score'
import { formatWaveHeight, getDirectionLabel } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  hourly: HourlyForecast[]
  tideData: TideReport | null
  units: { height: 'ft' | 'm' }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseLocalHour(isoTime: string): number {
  return parseInt(isoTime.substring(11, 13), 10)
}

function parseLocalDate(isoTime: string): string {
  return isoTime.substring(0, 10)
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

const SURF_START_HOUR = 5
const SURF_END_HOUR = 20  // inclusive; 8pm

// ── sub-components ────────────────────────────────────────────────────────────

function TideLabel({ state, t }: { state: 'rising' | 'falling' | 'slack'; t: (k: string) => string }) {
  const icons = { rising: '↑', falling: '↓', slack: '~' }
  const key = state === 'rising' ? 'sessions.risingTide' : state === 'falling' ? 'sessions.fallingTide' : 'sessions.slackTide'
  return (
    <span className="text-[10px] text-slate-500 whitespace-nowrap">
      {icons[state]} {t(key)}
    </span>
  )
}

function Timeline({ scored, windows }: { scored: ScoredHour[]; windows: SessionWindow[] }) {
  const [tooltip, setTooltip] = useState<{ hour: ScoredHour; x: number } | null>(null)

  if (!scored.length) return null

  const bestTimes = new Set(windows[0]?.hours.map(h => h.time))
  const runnerTimes = new Set(windows[1]?.hours.map(h => h.time))

  const maxScore = Math.max(...scored.map(h => h.compositeScore), 1)

  // Show hour labels every 3 hours
  const labelHours = new Set([5, 8, 11, 14, 17, 20])

  return (
    <div className="relative mb-1">
      <div
        className="flex items-end gap-0.5 h-12"
        onMouseLeave={() => setTooltip(null)}
      >
        {scored.map(h => {
          const isBest = bestTimes.has(h.time)
          const isRunner = runnerTimes.has(h.time)
          const heightPct = Math.max(15, (h.compositeScore / maxScore) * 100)
          return (
            <div
              key={h.time}
              className="flex-1 relative rounded-sm cursor-default transition-opacity hover:opacity-90"
              style={{
                height: `${heightPct}%`,
                backgroundColor: h.waveHeight < 0.15 ? 'rgba(100,116,139,0.2)' : h.rating.bgColor,
                border: isBest
                  ? `1px solid ${h.rating.color}`
                  : isRunner
                  ? `1px solid ${h.rating.color}55`
                  : '1px solid transparent',
                outline: isBest ? `1px solid ${h.rating.color}33` : undefined,
              }}
              onMouseEnter={e => {
                const rect = (e.target as HTMLElement).getBoundingClientRect()
                setTooltip({ hour: h, x: rect.left })
              }}
            />
          )
        })}
      </div>

      {/* Hour axis labels */}
      <div className="flex mt-1.5 text-[9px] text-slate-600 select-none">
        {scored.map(h => {
          const hr = parseLocalHour(h.time)
          return (
            <div key={h.time} className="flex-1 text-center leading-none">
              {labelHours.has(hr) ? formatHour(hr) : ''}
            </div>
          )
        })}
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute bottom-full mb-2 pointer-events-none z-10 rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg whitespace-nowrap"
          style={{ left: '50%', transform: 'translateX(-50%)', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(8px)' }}
        >
          <p className="font-semibold" style={{ color: 'var(--text-base)' }}>{formatHour(parseLocalHour(tooltip.hour.time))}</p>
          <p style={{ color: tooltip.hour.rating.color }}>{tooltip.hour.rating.label}</p>
          {tooltip.hour.waveHeight >= 0.15 && (
            <p style={{ color: 'var(--panel-label)' }}>
              {tooltip.hour.waveHeight.toFixed(1)}m · {Math.round(tooltip.hour.wavePeriod)}s · {Math.round(tooltip.hour.windSpeed)} km/h
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function WindowCard({ window: w, units, t }: { window: SessionWindow; units: { height: 'ft' | 'm' }; t: (k: string, v?: Record<string, string | number>) => string }) {
  const startHour = parseLocalHour(w.startTime)
  const endHour = startHour + 2
  const isTop = w.rank === 1
  const dirLabel = getDirectionLabel(w.hours[0]?.windDirection ?? 0)

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{
        borderColor: isTop ? `${w.hours[0]?.rating.color}40` : 'rgba(255,255,255,0.05)',
        background: isTop ? `${w.hours[0]?.rating.bgColor}` : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Rank indicator */}
      <div className="shrink-0 w-5 flex justify-center">
        {isTop ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-400">
            <path
              d="M7 1.5l1.4 3.1 3.3.5-2.4 2.3.6 3.3L7 9.1l-2.9 1.6.6-3.3L2.3 5.1l3.3-.5L7 1.5z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <span className="text-[9px] font-bold text-slate-600 leading-none pt-0.5">2</span>
        )}
      </div>

      {/* Time + rating */}
      <div className="min-w-[90px] shrink-0">
        <p className="text-sm font-semibold text-white tabular-nums leading-tight">
          {formatHour(startHour)} – {formatHour(endHour)}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: w.hours[0]?.rating.color }}>
          {w.hours[0]?.rating.label}
        </p>
      </div>

      {/* Wave / wind conditions */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {t('sessions.waveAt', {
            height: formatWaveHeight(w.avgWaveHeight, units.height),
            period: String(Math.round(w.avgPeriod)),
          })}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {t('sessions.wind', {
            speed: String(Math.round(w.avgWindSpeed)),
            dir: dirLabel,
          })}
        </p>
      </div>

      {/* Tide state */}
      <div className="shrink-0 text-right">
        <TideLabel state={w.tideState} t={t} />
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export default function SessionPlanner({ hourly, tideData, units }: Props) {
  const { t } = useLanguage()
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today')

  const tideHourly = tideData?.available ? tideData.hourly : []

  // Derive available day labels from hourly data (which starts at the current hour)
  const dates = useMemo(() => {
    const seen: string[] = []
    for (const h of hourly) {
      const d = parseLocalDate(h.time)
      if (!seen.includes(d)) seen.push(d)
      if (seen.length === 2) break
    }
    return seen
  }, [hourly])

  const todayDate = dates[0]
  const tomorrowDate = dates[1]
  const hasTomorrow = !!tomorrowDate

  const dayHours = useMemo(() => {
    const target = selectedDay === 'today' ? todayDate : tomorrowDate
    if (!target) return []
    return hourly.filter(h => {
      const hr = parseLocalHour(h.time)
      return parseLocalDate(h.time) === target && hr >= SURF_START_HOUR && hr <= SURF_END_HOUR
    })
  }, [hourly, selectedDay, todayDate, tomorrowDate])

  const { scored, windows } = useMemo(() => {
    const scored = scoreHours(dayHours, tideHourly)
    const windows = findBestWindows(scored, 2)
    return { scored, windows }
  }, [dayHours, tideHourly])

  const tabs: Array<{ key: 'today' | 'tomorrow'; label: string; disabled: boolean }> = [
    { key: 'today',    label: t('sessions.today'),    disabled: false },
    { key: 'tomorrow', label: t('sessions.tomorrow'), disabled: !hasTomorrow },
  ]

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6 border border-sky-500/10">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Premium</p>
          <p className="text-sm font-semibold text-white mt-0.5">{t('sessions.title')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t('sessions.subtitle')}</p>
        </div>

        {/* Day selector tabs */}
        <div className="flex gap-1 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setSelectedDay(tab.key)}
              disabled={tab.disabled}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                selectedDay === tab.key
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : tab.disabled
                  ? 'text-slate-700 border-transparent cursor-default'
                  : 'text-slate-400 hover:text-slate-300 border-transparent hover:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {scored.length > 0 ? (
        <>
          {/* Timeline */}
          <Timeline scored={scored} windows={windows} />

          {/* Window cards */}
          <div className="space-y-2 mt-4">
            {windows.length > 0 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  {t('sessions.recommended')}
                </p>
                {windows.map(w => (
                  <WindowCard key={w.startTime} window={w} units={units} t={t} />
                ))}
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center py-3">{t('sessions.noSurfable')}</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500 text-center py-6">{t('sessions.noData')}</p>
      )}
    </section>
  )
}

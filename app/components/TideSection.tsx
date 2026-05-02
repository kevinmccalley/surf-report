'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { TideExtreme, TideHeight } from '@/app/lib/types'

interface Props {
  extremes: TideExtreme[]
  hourly: TideHeight[]
  heightUnit: 'ft' | 'm'
  source: 'noaa' | 'dfo' | 'open-meteo'
  estimated: boolean
  timeFormat: 'noaa-local' | 'iso-utc' | 'iso-local'
  stationName?: string
  stationDistanceKm?: number
}

function toDisplay(meters: number, unit: 'ft' | 'm'): number {
  if (unit === 'ft') return Math.round(meters * 3.281 * 10) / 10
  return Math.round(meters * 10) / 10
}

function formatHeight(meters: number, unit: 'ft' | 'm'): string {
  return `${toDisplay(meters, unit)}${unit}`
}

// ── Unified time parser ───────────────────────────────────────────────────────
interface Parsed { year: number; month: number; day: number; hour: number; minute: number }

function parseTime(t: string): Parsed {
  const normalized = t.replace('T', ' ').replace(/Z$/, '').slice(0, 16)
  const [datePart, timePart] = normalized.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = (timePart ?? '00:00').split(':').map(Number)
  return { year, month, day, hour, minute }
}

function parsedToDate(p: Parsed): Date {
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute)
}

function formatTime(t: string): string {
  const { hour, minute } = parseTime(t)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:${String(minute).padStart(2, '0')} ${period}`
}

function formatDate(t: string): string {
  const { year, month, day } = parseTime(t)
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const tomorrowDate = new Date(now.getTime() + 86400000)
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${pad(tomorrowDate.getMonth() + 1)}-${pad(tomorrowDate.getDate())}`
  const dateStr = `${year}-${pad(month)}-${pad(day)}`
  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TideSection({
  extremes, hourly, heightUnit,
  source, estimated,
  stationName, stationDistanceKm,
}: Props) {
  const upcomingExtremes = extremes.slice(0, 10)

  // 5-day chart: up to 120 hourly points
  const chartData = hourly.slice(0, 120).map((h, i) => {
    const { hour } = parseTime(h.time)
    const isDay0 = i === 0
    const label = (hour === 0 || isDay0) ? (isDay0 ? 'Now' : formatDate(h.time)) : ''
    return {
      time: h.time,
      height: toDisplay(h.height, heightUnit),
      heightRaw: h.height,
      label,
    }
  })

  const heights = chartData.map(d => d.height)
  const minH = Math.min(...heights)
  const maxH = Math.max(...heights)
  const pad = Math.max((maxH - minH) * 0.12, 0.2)
  const yMin = Math.floor((minH - pad) * 10) / 10
  const yMax = Math.ceil((maxH + pad) * 10) / 10

  // Map each predicted extreme → nearest hourly chart index
  const extremeAtIndex = new Map<number, TideExtreme>()
  if (chartData.length > 0) {
    const startMs = parsedToDate(parseTime(chartData[0].time)).getTime()
    for (const extreme of extremes.slice(0, 20)) {
      const eMs = parsedToDate(parseTime(extreme.time)).getTime()
      const idx = Math.round((eMs - startMs) / 3600000)
      if (idx >= 0 && idx < chartData.length) {
        extremeAtIndex.set(idx, extreme)
      }
    }
  }

  // Custom dot: invisible for normal points, callout label at hi/lo extremes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDot = (dotProps: any) => {
    const { cx, cy, index } = dotProps
    const extreme = extremeAtIndex.get(index)
    if (!extreme || typeof cx !== 'number' || typeof cy !== 'number') {
      return <g key={`d${index}`} />
    }

    const isHigh = extreme.type === 'High'
    const color = isHigh ? '#2dd4bf' : '#94a3b8'
    const stroke = isHigh ? 'rgba(45,212,191,0.45)' : 'rgba(100,116,139,0.35)'
    const boxW = 60
    const boxH = 32
    const boxX = cx - boxW / 2
    const boxY = isHigh ? cy - 56 : cy + 14
    const lineY1 = isHigh ? cy - 6 : cy + 6
    const lineY2 = isHigh ? cy - 20 : cy + 14

    return (
      <g key={`x${index}`}>
        <line x1={cx} y1={lineY1} x2={cx} y2={lineY2}
          stroke={color} strokeWidth={1} strokeOpacity={0.55} />
        <circle cx={cx} cy={cy} r={5} fill={color}
          stroke="rgba(2,9,23,0.85)" strokeWidth={1.5} />
        <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={4}
          fill="rgba(2,9,23,0.92)" stroke={stroke} strokeWidth={1} />
        <text x={cx} y={boxY + 12} textAnchor="middle"
          fill={color} fontSize={9} fontWeight="700" fontFamily="system-ui,sans-serif">
          {formatTime(extreme.time)}
        </text>
        <text x={cx} y={boxY + 25} textAnchor="middle"
          fill="#e2e8f0" fontSize={9} fontFamily="system-ui,sans-serif">
          {formatHeight(extreme.height, heightUnit)}
        </text>
      </g>
    )
  }

  // Source attribution config
  const attribution = (() => {
    if (source === 'noaa') return {
      label: `NOAA station${stationName ? `: ${stationName}` : ''}${stationDistanceKm ? ` · ${stationDistanceKm} km away` : ''}`,
      note: 'times in local station time',
      badge: null,
    }
    if (source === 'dfo') return {
      label: `DFO station${stationName ? `: ${stationName}` : ''}${stationDistanceKm ? ` · ${stationDistanceKm} km away` : ''}`,
      note: 'times in UTC',
      badge: null,
    }
    return {
      label: 'Open-Meteo global tidal model (NEMO)',
      note: 'estimated from sea-level model · less precise than harmonic stations',
      badge: 'Estimated',
    }
  })()

  return (
    <div className="space-y-5">
      {/* Attribution row */}
      <div className="flex items-start sm:items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 mt-0.5 sm:mt-0">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        </svg>
        <span className="text-slate-400">{attribution.label}</span>
        {attribution.badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            {attribution.badge}
          </span>
        )}
        <span className="ml-auto text-slate-600 hidden sm:block">{attribution.note}</span>
      </div>
      {attribution.note && (
        <p className="text-xs text-slate-600 sm:hidden -mt-3">{attribution.note}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">

        {/* Upcoming hi/lo table */}
        <div className="lg:col-span-2 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Upcoming</p>
          {upcomingExtremes.length === 0 && (
            <p className="text-xs text-slate-600 px-3">No upcoming tide extremes available.</p>
          )}
          {upcomingExtremes.map((e, i) => {
            const isHigh = e.type === 'High'
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${
                  isHigh
                    ? 'bg-teal-500/8 border-teal-500/15'
                    : 'bg-white/3 border-white/5'
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                  isHigh ? 'bg-teal-500/15' : 'bg-white/5'
                }`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    {isHigh ? (
                      <path d="M7 11V3M4 6L7 3L10 6" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M7 3V11M4 8L7 11L10 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isHigh ? 'text-teal-300' : 'text-slate-400'}`}>
                    {isHigh ? 'High Tide' : 'Low Tide'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(e.time)} · {formatTime(e.time)}
                  </p>
                </div>

                <span className={`text-sm font-bold tabular-nums ${isHigh ? 'text-teal-200' : 'text-slate-400'}`}>
                  {formatHeight(e.height, heightUnit)}
                </span>
              </div>
            )
          })}
        </div>

        {/* 5-day scrollable tide chart */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest">5-Day Tide Curve</p>
            <p className="text-[10px] text-slate-600">scroll for 5 days →</p>
          </div>

          {/* Outer: clips to card width. Inner: 5/3 wide so 3 days fill the view. */}
          <div className="overflow-x-auto forecast-scroll rounded-lg" style={{ cursor: 'grab' }}>
            <div style={{ width: '167%', height: 284 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 56, right: 20, left: -18, bottom: 44 }}
                >
                  <defs>
                    <linearGradient id="tideAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={estimated ? 0.18 : 0.28} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />

                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[yMin, yMax]}
                    tickFormatter={(v: number) => `${v}${heightUnit}`}
                    width={40}
                  />

                  <Tooltip content={<TideTooltip heightUnit={heightUnit} />} />

                  <Area
                    type="monotone"
                    dataKey="height"
                    stroke={estimated ? '#94a3b8' : '#2dd4bf'}
                    strokeWidth={estimated ? 1.6 : 2.2}
                    strokeDasharray={estimated ? '4 2' : undefined}
                    fill="url(#tideAreaGrad)"
                    dot={renderDot}
                    activeDot={{ r: 4, fill: estimated ? '#94a3b8' : '#2dd4bf', stroke: 'white', strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TideTooltip({ active, payload, heightUnit }: {
  active?: boolean
  payload?: { payload: { time: string; height: number; heightRaw: number } }[]
  heightUnit: 'ft' | 'm'
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">
        {formatDate(d.time)} · {formatTime(d.time)}
      </p>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
        <span className="text-slate-400">Tide height</span>
        <span className="text-teal-200 font-semibold ml-auto pl-4">
          {heightUnit === 'ft'
            ? `${toDisplay(d.heightRaw, 'ft')}ft`
            : `${d.heightRaw.toFixed(2)}m`}
        </span>
      </div>
    </div>
  )
}

'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import type { TideExtreme, TideHeight } from '@/app/lib/types'

interface Props {
  extremes: TideExtreme[]
  hourly: TideHeight[]
  heightUnit: 'ft' | 'm'
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

// NOAA time format: "YYYY-MM-DD HH:MM" (local station time, no tz info)
// Parse without any Date constructor to avoid browser timezone ambiguity
function parseNoaaTime(t: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const [datePart, timePart] = t.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return { year, month, day, hour, minute }
}

function formatTime(t: string): string {
  const { hour, minute } = parseNoaaTime(t)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:${String(minute).padStart(2, '0')} ${period}`
}

function formatDate(t: string): string {
  const { year, month, day } = parseNoaaTime(t)
  // Compare date only against today/tomorrow (in wall-clock sense)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const tomorrowDate = new Date(now.getTime() + 86400000)
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`
  const dateStr = t.split(' ')[0]
  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  // Build weekday name without timezone weirdness
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TideSection({ extremes, hourly, heightUnit, stationName, stationDistanceKm }: Props) {
  const upcomingExtremes = extremes.slice(0, 10)

  // 5-day chart: 120 hourly points
  const chartData = hourly.slice(0, 120).map((h, i) => {
    const { hour } = parseNoaaTime(h.time)
    const isDay0 = i === 0
    const label = (hour === 0 || isDay0)
      ? (isDay0 ? 'Now' : formatDate(h.time))
      : ''
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

  return (
    <div className="space-y-5">
      {/* Station attribution */}
      {stationName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          </svg>
          <span>
            NOAA station: <span className="text-slate-400">{stationName}</span>
            {stationDistanceKm ? ` · ${stationDistanceKm} km away` : ''}
          </span>
          <span className="ml-auto text-slate-600">times shown in local station time</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">

        {/* Upcoming high/low table */}
        <div className="lg:col-span-2 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Upcoming</p>
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

        {/* 5-day tide chart */}
        <div className="lg:col-span-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">5-Day Tide Curve</p>
          <div className="w-full h-52 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="tideAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.28} />
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

                {/* Subtle reference lines at each extreme */}
                {upcomingExtremes.slice(0, 20).map((e, i) => {
                  // Find the matching chart point by time string prefix
                  const match = chartData.find(d => d.time.startsWith(e.time.slice(0, 13)))
                  if (!match?.label) return null
                  return (
                    <ReferenceLine
                      key={i}
                      x={match.label}
                      stroke={e.type === 'High' ? 'rgba(45,212,191,0.2)' : 'rgba(100,116,139,0.15)'}
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                  )
                })}

                <Area
                  type="monotone"
                  dataKey="height"
                  stroke="#2dd4bf"
                  strokeWidth={2.2}
                  fill="url(#tideAreaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2dd4bf', stroke: 'white', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
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

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
}

function toDisplay(meters: number, unit: 'ft' | 'm'): number {
  if (unit === 'ft') return Math.round(meters * 3.281 * 10) / 10
  return Math.round(meters * 10) / 10
}

function formatHeight(meters: number, unit: 'ft' | 'm'): string {
  return unit === 'ft' ? `${toDisplay(meters, unit)}ft` : `${toDisplay(meters, unit)}m`
}

function tideLabel(isoTime: string): { day: string; time: string } {
  const d = new Date(isoTime)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const day =
    d.toDateString() === now.toDateString() ? 'Today' :
    d.toDateString() === tomorrow.toDateString() ? 'Tomorrow' :
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return { day, time }
}

export default function TideSection({ extremes, hourly, heightUnit }: Props) {
  const upcomingExtremes = extremes.slice(0, 10)

  // Build 5-day chart dataset (120 hours)
  const nowTs = Date.now()
  const chartData = hourly.slice(0, 120).map(h => {
    const d = new Date(h.time)
    const hourNum = d.getHours()
    const elapsedH = (d.getTime() - nowTs) / 3600000
    return {
      time: h.time,
      height: toDisplay(h.height, heightUnit),
      heightM: h.height,
      label: (hourNum === 0 || Math.abs(elapsedH) < 1) && elapsedH >= 0
        ? (hourNum === 0
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : 'Now')
        : '',
      isNow: Math.abs(elapsedH) < 1,
    }
  })

  const heights = chartData.map(d => d.height)
  const minH = Math.min(...heights)
  const maxH = Math.max(...heights)
  const pad = Math.max((maxH - minH) * 0.12, 0.15)
  const yMin = Math.floor((minH - pad) * 10) / 10
  const yMax = Math.ceil((maxH + pad) * 10) / 10

  // Find "Now" index for reference line
  const nowIndex = chartData.findIndex(d => d.isNow)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">

      {/* Upcoming high/low table */}
      <div className="lg:col-span-2 space-y-1.5">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Upcoming</p>
        {upcomingExtremes.map((e, i) => {
          const { day, time } = tideLabel(e.time)
          const isHigh = e.type === 'High'
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                isHigh
                  ? 'bg-teal-500/8 border border-teal-500/15'
                  : 'bg-white/3 border border-white/5'
              }`}
            >
              {/* Arrow icon */}
              <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                isHigh ? 'bg-teal-500/15' : 'bg-white/5'
              }`}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {isHigh ? (
                    <path d="M7 11V3M4 6L7 3L10 6" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M7 3V11M4 8L7 11L10 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${isHigh ? 'text-teal-300' : 'text-slate-400'}`}>
                  {isHigh ? 'High Tide' : 'Low Tide'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {day} · {time}
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
                tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`}
                width={40}
              />

              <Tooltip content={<TideTooltip heightUnit={heightUnit} />} />

              {/* "Now" reference line */}
              {nowIndex >= 0 && (
                <ReferenceLine
                  x={chartData[nowIndex]?.label}
                  stroke="rgba(45,212,191,0.4)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              )}

              {/* Highlight extremes with reference lines */}
              {upcomingExtremes.slice(0, 20).map((e, i) => {
                const eTime = new Date(e.time).getTime()
                const closest = chartData.reduce((best, d, idx) => {
                  const diff = Math.abs(new Date(d.time).getTime() - eTime)
                  return diff < best.diff ? { idx, diff } : best
                }, { idx: -1, diff: Infinity })
                if (closest.idx < 0) return null
                const label = chartData[closest.idx]?.label
                if (!label) return null
                return (
                  <ReferenceLine
                    key={i}
                    x={label}
                    stroke={e.type === 'High' ? 'rgba(45,212,191,0.25)' : 'rgba(100,116,139,0.2)'}
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
  )
}

function TideTooltip({ active, payload, heightUnit }: {
  active?: boolean
  payload?: { payload: { time: string; height: number; heightM: number } }[]
  heightUnit: 'ft' | 'm'
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const dt = new Date(d.time)
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{dateStr} · {timeStr}</p>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
        <span className="text-slate-400">Tide height</span>
        <span className="text-teal-200 font-semibold ml-auto pl-4">
          {heightUnit === 'ft' ? `${d.height}ft` : `${d.heightM.toFixed(2)}m`}
        </span>
      </div>
    </div>
  )
}

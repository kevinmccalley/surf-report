'use client'

import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid, Legend
} from 'recharts'
import type { HourlyForecast } from '@/app/lib/types'
import { formatHour } from '@/app/lib/utils'

interface Props {
  hourly: HourlyForecast[]
  heightUnit: 'ft' | 'm'
  /** Aligned hourly tide heights (meters) for the same window */
  tideHeights?: number[]
}

interface ChartPoint {
  time: string
  displayLabel: string
  waveHeightDisplay: number
  waveHeightM: number
  windSpeed: number
  period: number
  tideDisplay?: number
}

function toDisplay(meters: number, unit: 'ft' | 'm'): number {
  if (unit === 'ft') return Math.round(meters * 3.281 * 10) / 10
  return Math.round(meters * 10) / 10
}

export default function WaveChart({ hourly, heightUnit, tideHeights }: Props) {
  const hasTide = tideHeights && tideHeights.length > 0

  const data: ChartPoint[] = hourly.map((h, i) => ({
    time: h.time,
    displayLabel: i % 6 === 0 ? formatHour(h.time) : '',
    waveHeightDisplay: toDisplay(h.waveHeight, heightUnit),
    waveHeightM: h.waveHeight,
    windSpeed: Math.round(h.windSpeed),
    period: Math.round(h.wavePeriod),
    tideDisplay: hasTide && tideHeights[i] !== undefined
      ? toDisplay(tideHeights[i], heightUnit)
      : undefined,
  }))

  const maxWave = Math.max(...data.map(d => d.waveHeightDisplay), 1)
  const waveYMax = Math.ceil(maxWave * 1.35)

  const tidePts = data.map(d => d.tideDisplay).filter((v): v is number => v !== undefined)
  const tideMin = tidePts.length ? Math.min(...tidePts) : 0
  const tideMax = tidePts.length ? Math.max(...tidePts) : 1
  const tidePad = Math.max((tideMax - tideMin) * 0.15, 0.2)
  const tideYMin = Math.floor((tideMin - tidePad) * 10) / 10
  const tideYMax = Math.ceil((tideMax + tidePad) * 10) / 10

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 px-1">
        <LegendDot color="#0ea5e9" label="Wave height" />
        <LegendDot color="rgba(100,116,139,0.6)" dashed label="Wind speed" />
        {hasTide && <LegendDot color="#2dd4bf" label="Tide height" />}
      </div>

      <div className="w-full h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: hasTide ? 48 : 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="windGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="displayLabel"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />

            {/* Left Y-axis: waves (and wind, same scale) */}
            <YAxis
              yAxisId="wave"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, waveYMax]}
              tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`}
              width={42}
            />

            {/* Right Y-axis: tides */}
            {hasTide && (
              <YAxis
                yAxisId="tide"
                orientation="right"
                tick={{ fill: '#2dd4bf', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[tideYMin, tideYMax]}
                tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`}
                width={40}
              />
            )}

            <Tooltip content={<CustomTooltip heightUnit={heightUnit} hasTide={hasTide ?? false} />} />

            {/* Wind speed (secondary, same left axis) */}
            <Area
              yAxisId="wave"
              type="monotone"
              dataKey="windSpeed"
              stroke="rgba(100,116,139,0.45)"
              strokeWidth={1}
              fill="url(#windGrad2)"
              strokeDasharray="3 2"
              dot={false}
              activeDot={false}
            />

            {/* Wave height */}
            <Area
              yAxisId="wave"
              type="monotone"
              dataKey="waveHeightDisplay"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fill="url(#waveGrad2)"
              dot={false}
              activeDot={{ r: 4, fill: '#0ea5e9', stroke: 'white', strokeWidth: 1.5 }}
            />

            {/* Tide line */}
            {hasTide && (
              <Line
                yAxisId="tide"
                type="monotone"
                dataKey="tideDisplay"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3.5, fill: '#2dd4bf', stroke: 'white', strokeWidth: 1.5 }}
                strokeDasharray="none"
              />
            )}

            {/* "Now" line */}
            <ReferenceLine
              yAxisId="wave"
              x={data[0]?.displayLabel}
              stroke="rgba(14,165,233,0.4)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {dashed
        ? <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
        : <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      }
      <span>{label}</span>
    </div>
  )
}

function CustomTooltip({ active, payload, heightUnit, hasTide }: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  heightUnit: 'ft' | 'm'
  hasTide: boolean
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{formatHour(d.time)}</p>
      <div className="space-y-1">
        <Row color="#0ea5e9" label="Waves" value={heightUnit === 'ft' ? `${d.waveHeightDisplay}ft` : `${d.waveHeightM.toFixed(1)}m`} />
        {d.period > 0 && <Row color="#7dd3fc" label="Period" value={`${d.period}s`} />}
        <Row color="rgba(100,116,139,0.7)" label="Wind" value={`${d.windSpeed} km/h`} />
        {hasTide && d.tideDisplay !== undefined && (
          <Row color="#2dd4bf" label="Tide" value={heightUnit === 'ft' ? `${d.tideDisplay}ft` : `${d.tideDisplay}m`} />
        )}
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold ml-auto pl-4">{value}</span>
    </div>
  )
}

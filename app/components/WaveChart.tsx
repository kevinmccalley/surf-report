'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid
} from 'recharts'
import type { HourlyForecast } from '@/app/lib/types'
import { formatHour } from '@/app/lib/utils'

interface Props {
  hourly: HourlyForecast[]
  heightUnit: 'ft' | 'm'
}

interface ChartPoint {
  time: string
  label: string
  waveHeight: number
  waveHeightDisplay: number
  windSpeed: number
  period: number
}

export default function WaveChart({ hourly, heightUnit }: Props) {
  const data: ChartPoint[] = hourly.map(h => {
    const m = h.waveHeight
    const display = heightUnit === 'ft' ? Math.round(m * 3.281 * 10) / 10 : Math.round(m * 10) / 10
    return {
      time: h.time,
      label: formatHour(h.time),
      waveHeight: m,
      waveHeightDisplay: display,
      windSpeed: Math.round(h.windSpeed),
      period: Math.round(h.wavePeriod),
    }
  })

  // Only show label every 6 points
  const labeledData = data.map((d, i) => ({
    ...d,
    displayLabel: i % 6 === 0 ? d.label : '',
  }))

  const maxWave = Math.max(...data.map(d => d.waveHeightDisplay), 1)
  const yMax = Math.ceil(maxWave * 1.3)

  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={labeledData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="displayLabel"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />

          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, yMax]}
            tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`}
            width={42}
          />

          <Tooltip content={<CustomTooltip heightUnit={heightUnit} />} />

          {/* Wind speed scaled to same axis range */}
          <Area
            type="monotone"
            dataKey="windSpeed"
            stroke="rgba(100,116,139,0.4)"
            strokeWidth={1}
            fill="url(#windGrad)"
            strokeDasharray="3 2"
            dot={false}
            activeDot={false}
          />

          {/* Wave height */}
          <Area
            type="monotone"
            dataKey="waveHeightDisplay"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            fill="url(#waveGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#0ea5e9', stroke: 'white', strokeWidth: 1.5 }}
          />

          {/* "Now" line at index 0 */}
          <ReferenceLine x={labeledData[0]?.displayLabel} stroke="rgba(14,165,233,0.5)" strokeWidth={1.5} strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, heightUnit }: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  heightUnit: 'ft' | 'm'
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{d.label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="text-slate-400">Waves</span>
          <span className="text-white font-semibold ml-auto">
            {heightUnit === 'ft'
              ? `${Math.round(d.waveHeight * 3.281 * 10) / 10}ft`
              : `${d.waveHeight.toFixed(1)}m`
            }
          </span>
        </div>
        {d.period > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Period</span>
            <span className="text-white font-semibold ml-auto">{d.period}s</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="text-slate-400">Wind</span>
          <span className="text-white font-semibold ml-auto">{d.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  )
}

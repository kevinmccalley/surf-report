'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import type { DailyAccuracyRecord } from '@/app/api/accuracy-history/route'

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${SHORT_MONTHS[parseInt(m) - 1]} ${parseInt(d)}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: DailyAccuracyRecord }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl border border-white/10 whitespace-nowrap"
      style={{ background: 'rgba(8,14,28,0.96)', backdropFilter: 'blur(8px)' }}>
      <p className="text-white font-semibold mb-1.5">{formatDate(d.date)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-400">
        <span>Overall</span>
        <span className="text-teal-300 font-semibold tabular-nums">{d.overallPct}%</span>
        <span>Avg error</span>
        <span className="text-slate-300 tabular-nums">{d.avgError} min</span>
        <span>Matches</span>
        <span className="text-slate-300 tabular-nums">{d.totalMatches}</span>
      </div>
    </div>
  )
}

interface Props {
  records: DailyAccuracyRecord[]
}

export default function AccuracyTrendChart({ records }: Props) {
  if (records.length < 3) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-600 text-center">
        Trend chart will appear after a few days of data.
        <br />
        <span className="text-slate-700 text-xs mt-1">
          {records.length} day{records.length !== 1 ? 's' : ''} recorded so far.
        </span>
      </div>
    )
  }

  // Thin the dataset if > 90 records to keep labels readable
  const data = records.length > 90
    ? records.filter((_, i) => i % 7 === 0 || i === records.length - 1)
    : records

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={60} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 4" />
        <ReferenceLine y={80} stroke="rgba(45,212,191,0.2)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="overallPct"
          stroke="#2dd4bf"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

'use client'

import { useState } from 'react'
import type { ClimatologyMonth } from '@/app/api/climatology/route'

export type { ClimatologyMonth }

interface Props {
  months: ClimatologyMonth[]
  peakMonths: number[]
}

const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ClimatologySection({ months, peakMonths }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const maxHs       = Math.max(...months.map(m => m.avgHs), 0.1)
  const currentMo   = new Date().getMonth() + 1
  const hoveredData = hovered != null ? months.find(m => m.month === hovered) ?? null : null

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Best time to visit
          </p>
          <p className="text-xs text-slate-600">
            3-year monthly avg · offshore significant wave height · 2022–2024
          </p>
        </div>
        {peakMonths.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-600">Peak surf season:</span>
            {peakMonths.map(m => (
              <span
                key={m}
                className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/20"
              >
                {SHORT[m - 1]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="relative select-none">

        {/* Tooltip */}
        {hoveredData && (
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 glass-card rounded-xl px-3 py-2.5 text-xs shadow-xl border border-white/10 pointer-events-none whitespace-nowrap"
          >
            <p className="text-white font-semibold mb-1.5">{hoveredData.name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-400">
              <span>Avg Hs</span>
              <span className="text-teal-300 font-medium tabular-nums">{hoveredData.avgHs} m</span>
              <span>Avg period</span>
              <span className="text-slate-300 tabular-nums">{hoveredData.avgSwellPeriod} s</span>
              <span>Swell direction</span>
              <span className="text-slate-300">{hoveredData.dominantDirectionLabel}</span>
            </div>
          </div>
        )}

        {/* Bars */}
        <div className="flex items-end gap-0.5 sm:gap-1" style={{ height: '120px' }}>
          {months.map((m) => {
            const isPeak    = peakMonths.includes(m.month)
            const isCurrent = m.month === currentMo
            const isHovered = hovered === m.month
            const heightPct = Math.max((m.avgHs / maxHs) * 100, 3)

            let barColor = 'bg-slate-700'
            if (isPeak)    barColor = 'bg-teal-500'
            if (isCurrent) barColor = 'bg-sky-500'
            if (isPeak && isCurrent) barColor = 'bg-teal-400'

            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1 cursor-default"
                onMouseEnter={() => setHovered(m.month)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Bar container — aligns all bars to bottom */}
                <div className="w-full flex items-end" style={{ height: '96px' }}>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-150 ${barColor} ${
                      isHovered ? 'opacity-100 brightness-125' : 'opacity-60 hover:opacity-80'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                {/* Month label */}
                <span className={`text-[9px] sm:text-[10px] font-medium ${
                  isPeak    ? 'text-teal-400' :
                  isCurrent ? 'text-sky-400'  : 'text-slate-600'
                }`}>
                  {SHORT[m.month - 1]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Y-axis reference lines */}
        <div className="absolute inset-x-0 top-0 h-24 flex flex-col justify-between pointer-events-none">
          {[maxHs, maxHs * 0.5, 0].map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[9px] text-slate-700 w-7 text-right tabular-nums shrink-0">
                {v.toFixed(1)}m
              </span>
              <div className="flex-1 border-t border-slate-800/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[10px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-500 opacity-70" />
          Peak months
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-500 opacity-70" />
          This month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-700 opacity-70" />
          Off-peak
        </span>
        <span className="ml-auto">Hover a bar for details</span>
      </div>

      {/* Monthly detail strip */}
      <div className="overflow-x-auto forecast-scroll -mx-1 px-1">
        <div className="flex gap-1 min-w-max">
          {months.map((m) => {
            const isPeak    = peakMonths.includes(m.month)
            const isCurrent = m.month === currentMo
            return (
              <div
                key={m.month}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-center ${
                  isPeak && isCurrent ? 'bg-teal-500/10 border border-teal-500/20' :
                  isPeak    ? 'bg-teal-500/8 border border-teal-500/15' :
                  isCurrent ? 'bg-sky-500/8 border border-sky-500/15' :
                              'bg-white/3 border border-white/5'
                }`}
                style={{ minWidth: '3.5rem' }}
              >
                <span className={`text-[10px] font-semibold ${
                  isPeak ? 'text-teal-400' : isCurrent ? 'text-sky-400' : 'text-slate-500'
                }`}>
                  {SHORT[m.month - 1]}
                </span>
                <span className="text-xs font-bold text-white tabular-nums">{m.avgHs}m</span>
                <span className="text-[9px] text-slate-600">{m.avgSwellPeriod}s {m.dominantDirectionLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

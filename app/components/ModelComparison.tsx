'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import type { ModelComparisonData, ModelComparisonDay } from '@/app/lib/types'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  lat: number
  lon: number
  units: { height: 'ft' | 'm' }
}

function toDisplay(m: number, unit: 'ft' | 'm'): number {
  return unit === 'ft' ? Math.round(m * 3.281 * 10) / 10 : Math.round(m * 10) / 10
}

const AGREEMENT_COLORS: Record<string, string> = {
  high:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

export default function ModelComparison({ lat, lon, units }: Props) {
  const { t } = useLanguage()
  const [data, setData]       = useState<ModelComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ModelComparisonDay | null>(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/model-comparison?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [lat, lon])

  if (loading) {
    return (
      <section className="glass-card rounded-2xl p-4 sm:p-6 border border-sky-500/10 animate-pulse">
        <div className="h-4 w-40 bg-white/10 rounded mb-2" />
        <div className="h-3 w-56 bg-white/6 rounded mb-6" />
        <div className="h-36 bg-white/4 rounded" />
      </section>
    )
  }

  if (!data?.available || !data.days.length) return null

  const chartData = data.days.map(d => ({
    name: d.dayName,
    cmems: toDisplay(d.cmems.waveHeight, units.height),
    gfs:   toDisplay(d.gfs.waveHeight,   units.height),
  }))

  const unitLabel = units.height === 'ft' ? 'ft' : 'm'

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6 border border-sky-500/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {t('modelComp.title')}
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {t('modelComp.subtitle')}
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/12 text-sky-400 border border-sky-500/20 font-medium shrink-0">
          Premium
        </span>
      </div>

      {/* Chart */}
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}${unitLabel}`}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v: number, name: string) => [`${v} ${unitLabel}`, name === 'cmems' ? t('modelComp.cmems') : t('modelComp.gfs')]}
            />
            <Line
              type="monotone" dataKey="cmems"
              stroke="#38bdf8" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: '#38bdf8' }}
              name="cmems"
            />
            <Line
              type="monotone" dataKey="gfs"
              stroke="#fb923c" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: '#fb923c' }}
              name="gfs"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-sky-400 inline-block" />
          <span className="text-slate-400">{t('modelComp.cmems')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-orange-400 inline-block" />
          <span className="text-slate-400">{t('modelComp.gfs')}</span>
        </span>
      </div>

      {/* Day agreement chips */}
      <div className="overflow-x-auto -mx-1 px-1 mb-4">
        <div className="flex gap-1.5 min-w-max">
          {data.days.map(day => (
            <button
              key={day.date}
              onClick={() => setSelected(s => s?.date === day.date ? null : day)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all
                ${AGREEMENT_COLORS[day.agreement]}
                ${selected?.date === day.date ? 'ring-1 ring-white/20' : 'opacity-80 hover:opacity-100'}
              `}
            >
              <span className="text-slate-300">{day.dayName}</span>
              <span>
                {day.agreement === 'high'   ? '●●●' :
                 day.agreement === 'medium' ? '●●○' : '●○○'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="glass-card rounded-xl px-4 py-3 border border-white/8 text-xs">
          <p className="text-slate-300 font-semibold mb-2">{selected.dayName}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sky-400 font-medium mb-1">{t('modelComp.cmems')}</p>
              <p className="text-slate-400">{t('modelComp.waveHeight')}: <span className="text-white">{toDisplay(selected.cmems.waveHeight, units.height)}{unitLabel}</span></p>
              <p className="text-slate-400">{t('modelComp.period')}: <span className="text-white">{selected.cmems.wavePeriod}s</span></p>
              <p className="text-slate-400">{t('modelComp.swell')}: <span className="text-white">{selected.cmems.swellDirLabel}</span></p>
            </div>
            <div>
              <p className="text-orange-400 font-medium mb-1">{t('modelComp.gfs')}</p>
              <p className="text-slate-400">{t('modelComp.waveHeight')}: <span className="text-white">{toDisplay(selected.gfs.waveHeight, units.height)}{unitLabel}</span></p>
              <p className="text-slate-400">{t('modelComp.period')}: <span className="text-white">{selected.gfs.wavePeriod}s</span></p>
              <p className="text-slate-400">{t('modelComp.swell')}: <span className="text-white">{selected.gfs.swellDirLabel}</span></p>
            </div>
          </div>
          <p className={`mt-2 text-[10px] font-medium ${
            selected.agreement === 'high' ? 'text-emerald-400' :
            selected.agreement === 'medium' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {selected.agreement === 'high'   ? t('modelComp.agree') :
             selected.agreement === 'medium' ? t('modelComp.mixed') : t('modelComp.diverge')}
          </p>
        </div>
      )}

      {/* Footer explanation */}
      <p className="text-[11px] text-slate-600 mt-3">{t('modelComp.explanation')}</p>
    </section>
  )
}

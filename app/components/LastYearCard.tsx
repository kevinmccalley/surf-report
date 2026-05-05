'use client'

import type { SurfReport } from '@/app/lib/types'
import { useLanguage } from '@/app/i18n/LanguageContext'

type Units = { temp: 'c' | 'f'; height: 'ft' | 'm' }

const RATING_COLORS: Record<string, string> = {
  'EPIC':         'text-purple-300 bg-purple-500/15 border-purple-500/25',
  'VERY GOOD':    'text-teal-300   bg-teal-500/15   border-teal-500/25',
  'GOOD':         'text-green-300  bg-green-500/15  border-green-500/25',
  'FAIR TO GOOD': 'text-lime-300   bg-lime-500/15   border-lime-500/25',
  'FAIR':         'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
  'POOR TO FAIR': 'text-orange-300 bg-orange-500/15 border-orange-500/25',
  'POOR':         'text-red-300    bg-red-500/15    border-red-500/25',
  'FLAT':         'text-slate-400  bg-slate-500/10  border-slate-500/20',
}

interface Props {
  report: SurfReport
  units: Units
  onViewFull: (date: string) => void
}

export default function LastYearCard({ report, units, onViewFull }: Props) {
  const { t, bcp47 } = useLanguage()
  const date = report.historicalDate!
  const c = report.current
  const waveDisplay = units.height === 'ft'
    ? `${(c.waveHeight * 3.28084).toFixed(1)} ft`
    : `${c.waveHeight.toFixed(1)} m`
  const ratingCls = RATING_COLORS[c.rating.label] ?? RATING_COLORS['FLAT']

  const [y, m, d] = date.split('-').map(Number)
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString(bcp47, { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5" style={{ opacity: 0.88 }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">
            {t('lastYear.title')}
          </p>
          <button
            onClick={() => onViewFull(date)}
            className="text-xs text-slate-400 hover:text-sky-300 transition-colors hover:underline underline-offset-2"
          >
            {formattedDate}
          </button>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${ratingCls}`}>
          {t('rating.' + c.rating.label.replace(/ /g, '_'))}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">{t('lastYear.waves')}</p>
          <p className="text-sm font-bold text-slate-200">{waveDisplay}</p>
          <p className="text-[10px] text-slate-500">{t('lastYear.period', { period: c.primarySwell.period })}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">{t('lastYear.swell')}</p>
          <p className="text-sm font-bold text-slate-200">{c.primarySwell.directionLabel}</p>
          <p className="text-[10px] text-slate-500">{c.primarySwell.height.toFixed(1)} m Hs</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">{t('lastYear.wind')}</p>
          <p className="text-sm font-bold text-slate-200">{Math.round(c.wind.speed)} km/h</p>
          <p className="text-[10px] text-slate-500">{c.wind.directionLabel}</p>
        </div>
      </div>

      <button
        onClick={() => onViewFull(date)}
        className="mt-3 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
      >
        {t('lastYear.viewFull')}
      </button>
    </div>
  )
}

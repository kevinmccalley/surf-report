'use client'

import { useEffect, useState } from 'react'
import { Zap, TrendingUp } from 'lucide-react'
import { formatWaveHeight } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { EpicNowData, EpicSpot } from '@/app/lib/types'

interface Props {
  units: { height: 'ft' | 'm' }
  onSelect: (spot: { lat: number; lon: number; name: string; country: string; displayName: string }) => void
}

function ratingBadge(label: string): { text: string; cls: string } {
  switch (label) {
    case 'EPIC':        return { text: 'Epic',          cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
    case 'VERY GOOD':   return { text: 'Very Good',     cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    case 'GOOD':        return { text: 'Good',          cls: 'bg-sky-500/20 text-sky-300 border-sky-500/30' }
    case 'FAIR TO GOOD':return { text: 'Fair–Good',     cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' }
    case 'FAIR':        return { text: 'Fair',          cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
    default:            return { text: label,            cls: 'bg-white/10 text-slate-400 border-white/10' }
  }
}

export default function EpicNowSection({ units, onSelect }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<EpicNowData | null>(null)

  useEffect(() => {
    fetch('/api/epic-now')
      .then(r => r.json())
      .then((d: EpicNowData) => setData(d))
      .catch(() => {})
  }, [])

  if (!data || data.spots.length === 0) return null

  const hasEpic = data.spots.some(s => s.ratingLabel === 'EPIC')
  const Icon = hasEpic ? Zap : TrendingUp
  const accentClass = hasEpic
    ? 'border-purple-500/20 bg-purple-500/5'
    : 'border-sky-500/20 bg-sky-500/5'
  const headerClass = hasEpic ? 'text-purple-300' : 'text-sky-300'
  const iconClass   = hasEpic ? 'text-purple-400' : 'text-sky-400'
  const title = hasEpic ? t('epicNow.title') : t('epicNow.titleBest')

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-2">
      <div className={`glass-card rounded-2xl p-4 sm:p-6 border ${accentClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon size={14} className={`${iconClass} shrink-0`} />
          <h2 className={`text-xs font-semibold uppercase tracking-widest ${headerClass}`}>
            {title}
          </h2>
          <span className="ml-auto text-xs text-slate-600">
            {t('epicNow.updated').replace('{time}', new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {data.spots.map((spot) => (
            <SpotCard
              key={`${spot.lat}-${spot.lon}`}
              spot={spot}
              units={units}
              onSelect={onSelect}
              t={t}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function SpotCard({
  spot, units, onSelect, t,
}: {
  spot: EpicSpot
  units: { height: 'ft' | 'm' }
  onSelect: Props['onSelect']
  t: (k: string) => string
}) {
  const badge = ratingBadge(spot.ratingLabel)
  return (
    <button
      onClick={() => onSelect({ lat: spot.lat, lon: spot.lon, name: spot.name, country: '', displayName: spot.name })}
      className="text-left rounded-xl p-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <p className="text-xs text-slate-400 truncate mb-1 group-hover:text-slate-300 transition-colors">
        {spot.name}
      </p>
      <p className="text-lg font-bold text-white tabular-nums leading-none">
        {formatWaveHeight(spot.waveHeight, units.height)}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {spot.swellDirLabel} · {Math.round(spot.wavePeriod)}s
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
          {badge.text}
        </span>
        <span className="text-[10px] text-slate-600">
          {t('epicNow.wind').replace('{speed}', String(Math.round(spot.windSpeed)))}
        </span>
      </div>
    </button>
  )
}

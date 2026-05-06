'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { formatWaveHeight } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { EpicNowData, EpicSpot } from '@/app/lib/types'

interface Props {
  units: { height: 'ft' | 'm' }
  onSelect: (spot: { lat: number; lon: number; name: string; country: string; displayName: string }) => void
}

export default function EpicNowSection({ units, onSelect }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<EpicNowData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/epic-now')
      .then(r => r.json())
      .then((d: EpicNowData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && (!data || data.spots.length === 0)) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-2">
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-purple-400 shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-300">
            {t('epicNow.title')}
          </h2>
          {data && (
            <span className="ml-auto text-xs text-slate-600">
              {t('epicNow.updated').replace('{time}', new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
            </span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl p-3 bg-white/5 space-y-2">
                <div className="h-3 bg-white/10 rounded w-24" />
                <div className="h-5 bg-white/10 rounded w-14" />
                <div className="h-2.5 bg-white/10 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {data && data.spots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.spots.slice(0, 12).map((spot) => (
              <SpotCard
                key={`${spot.lat}-${spot.lon}`}
                spot={spot}
                units={units}
                onSelect={onSelect}
                t={t}
              />
            ))}
          </div>
        )}
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
  return (
    <button
      onClick={() => onSelect({ lat: spot.lat, lon: spot.lon, name: spot.name, country: '', displayName: spot.name })}
      className="text-left rounded-xl p-3 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group"
    >
      <p className="text-xs text-slate-400 truncate mb-1 group-hover:text-slate-300 transition-colors">
        {spot.name}
      </p>
      <p className="text-lg font-bold text-white tabular-nums leading-none">
        {formatWaveHeight(spot.waveHeight, units.height)}
      </p>
      <p className="text-xs text-purple-300/80 mt-1">
        {spot.swellDirLabel} · {Math.round(spot.wavePeriod)}s
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        {t('epicNow.wind').replace('{speed}', String(Math.round(spot.windSpeed)))}
      </p>
    </button>
  )
}

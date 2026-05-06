'use client'

import type { NearbySpot } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { Wind, Droplets } from 'lucide-react'
import WeatherIcon from './WeatherIcon'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  spots: NearbySpot[]
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  onSelect: (spot: NearbySpot) => void
}

export default function NearbySpots({ spots, units, onSelect }: Props) {
  const { t } = useLanguage()
  if (!spots.length) return null

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
        {t('nearby.title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {spots.map((spot, idx) => (
          <SpotRow
            key={`${spot.lat}-${spot.lon}`}
            spot={spot}
            units={units}
            rank={idx + 1}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

function SpotRow({
  spot, units, rank, onSelect, t,
}: {
  spot: NearbySpot
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  rank: number
  onSelect: (s: NearbySpot) => void
  t: (k: string) => string
}) {
  const away = t('nearby.away').replace('{dist}', String(spot.distanceKm))

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(spot)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-xs text-slate-600 tabular-nums w-4 shrink-0 text-right">{rank}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{spot.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{away}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tabular-nums" style={{ color: spot.rating.color }}>
            {formatWaveHeight(spot.waveHeight, units.height)}
          </span>
          <span
            className="hidden sm:inline text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: spot.rating.bgColor, color: spot.rating.color }}
          >
            {t('rating.' + spot.rating.label.replace(/ /g, '_'))}
          </span>
          <WeatherIcon code={spot.weatherCode} size={13} />
        </div>
      </button>

      {/* Hover tooltip */}
      <div className="absolute left-1 bottom-full mb-1.5 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div
          className="rounded-xl p-3 w-52 shadow-xl"
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-xs font-semibold text-white mb-2 truncate">{spot.name}</p>
          <div className="space-y-1.5">
            <TipRow
              icon={<Wind size={12} className="text-slate-400" />}
              label={`${Math.round(spot.windSpeed)} km/h ${t('dir.' + spot.windDirectionLabel)}`}
            />
            <TipRow
              icon={<span className="text-sky-400 text-[11px] font-bold leading-none">~</span>}
              label={`${formatWaveHeight(spot.waveHeight, units.height)} · ${t('dir.' + spot.swellDirectionLabel)} ${t('cards.swell').toLowerCase()}`}
            />
            {spot.waterTemp !== null && (
              <TipRow
                icon={<Droplets size={12} className="text-sky-400" />}
                label={formatTemp(spot.waterTemp, units.temp)}
              />
            )}
            <TipRow
              icon={<WeatherIcon code={spot.weatherCode} size={12} />}
              label={t('weather.' + spot.weatherCode)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TipRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-300">
      <span className="w-3 shrink-0 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

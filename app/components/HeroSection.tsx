'use client'

import type { SurfReport } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { MapPin, Clock, Wind, Droplets, Thermometer } from 'lucide-react'
import WeatherIcon from './WeatherIcon'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  report: SurfReport
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  onMapOpen?: () => void
}

export default function HeroSection({ report, units, onMapOpen }: Props) {
  const { t, bcp47 } = useLanguage()
  const { current, location } = report
  const { rating } = current
  const updatedTime = new Date(report.updatedAt).toLocaleTimeString(bcp47, {
    hour: 'numeric', minute: '2-digit'
  })

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-8 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${rating.color} 0%, transparent 70%)` }}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onMapOpen}
            aria-label={t('map.openTip')}
            title={t('map.openTip')}
            className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 transition-colors disabled:pointer-events-none"
            disabled={!onMapOpen}
          >
            <MapPin size={26} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-white">
            {location.name}
            {location.country && <span className="text-slate-400 font-normal">, {location.country}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={11} />
          <span>{t('hero.updatedAt', { time: updatedTime })}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-5">
        <div className="flex items-end gap-4">
          {report.isCoastal ? (
            <div className="relative">
              <div
                className="text-6xl sm:text-8xl font-bold leading-none tracking-tighter count-up"
                style={{ color: rating.color }}
              >
                {formatWaveHeight(current.waveHeight, units.height)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{t('hero.waveHeight')}</div>
            </div>
          ) : (
            <div className="text-4xl font-bold text-slate-400">{t('hero.noWaveData')}</div>
          )}

          {report.isCoastal && (
            <div className="pb-1 flex flex-col gap-1.5">
              <div
                className="rating-chip inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                data-rating={rating.label.replace(/ /g, '_')}
                style={{ backgroundColor: rating.bgColor, border: `1px solid ${rating.color}30` }}
              >
                {t('rating.' + rating.label.replace(/ /g, '_'))}
              </div>
              {current.wavePeriod > 0 && (
                <div className="text-xs text-slate-400">
                  {t('hero.periodSuffix', { period: current.wavePeriod.toFixed(0) })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sm:ml-auto flex flex-wrap gap-3 sm:gap-4">
          <StatPill
            icon={<WeatherIcon code={current.weatherCode} size={16} />}
            value={t('weather.' + current.weatherCode)}
          />
          <StatPill
            icon={<Thermometer size={14} className="text-orange-400" />}
            value={formatTemp(current.airTemp, units.temp)}
            label={t('hero.air')}
          />
          {current.waterTemp !== null && (
            <StatPill
              icon={<Droplets size={14} className="text-sky-400" />}
              value={formatTemp(current.waterTemp, units.temp)}
              label={t('hero.water')}
            />
          )}
          <StatPill
            icon={<Wind size={14} className="text-slate-400" />}
            value={`${Math.round(current.wind.speed)} km/h`}
            label={t('dir.' + current.wind.directionLabel)}
          />
        </div>
      </div>

      {report.isCoastal && (
        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <MiniStat label={t('hero.primarySwell')} value={formatWaveHeight(current.primarySwell.height, units.height)} />
          <MiniStat label={t('hero.swellPeriod')} value={`${current.primarySwell.period.toFixed(0)}s`} />
          <MiniStat label={t('hero.swellDir')} value={t('dir.' + current.primarySwell.directionLabel)} />
          <MiniStat label={t('hero.wind')} value={`${Math.round(current.wind.speed)} km/h`} />
          <MiniStat label={t('hero.windGust')} value={`${Math.round(current.wind.gust)} km/h`} />
          <MiniStat label={t('hero.uvIndex')} value={current.uvIndex > 0 ? current.uvIndex.toFixed(0) : '—'} uvVal={current.uvIndex} />
        </div>
      )}
    </section>
  )
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {icon}
      <span className="text-white font-medium">{value}</span>
      {label && <span className="text-slate-500 text-xs">{label}</span>}
    </div>
  )
}

function MiniStat({ label, value, uvVal }: { label: string; value: string; uvVal?: number }) {
  const uvColor = uvVal !== undefined
    ? uvVal <= 2 ? '#22c55e' : uvVal <= 5 ? '#eab308' : uvVal <= 7 ? '#f97316' : '#ef4444'
    : undefined

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-white" style={uvColor ? { color: uvColor } : undefined}>{value}</span>
    </div>
  )
}

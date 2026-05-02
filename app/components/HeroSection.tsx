'use client'

import type { SurfReport } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { MapPin, Clock, Wind, Droplets, Thermometer } from 'lucide-react'
import WeatherIcon from './WeatherIcon'

interface Props {
  report: SurfReport
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

export default function HeroSection({ report, units }: Props) {
  const { current, location } = report
  const { rating } = current
  const updatedTime = new Date(report.updatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  })

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-8 relative overflow-hidden">
      {/* Background glow behind wave number */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${rating.color} 0%, transparent 70%)` }}
      />

      {/* Location + time */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-sky-400" />
          <h1 className="text-base sm:text-lg font-semibold text-white">
            {location.name}
            {location.country && <span className="text-slate-400 font-normal">, {location.country}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={11} />
          <span>Updated {updatedTime}</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-5">
        {/* Wave height */}
        <div className="flex items-end gap-4">
          {report.isCoastal ? (
            <div className="relative">
              <div
                className="text-6xl sm:text-8xl font-bold leading-none tracking-tighter count-up"
                style={{ color: rating.color }}
              >
                {formatWaveHeight(current.waveHeight, units.height)}
              </div>
              <div className="text-xs text-slate-500 mt-1">wave height</div>
            </div>
          ) : (
            <div className="text-4xl font-bold text-slate-400">No Wave Data</div>
          )}

          {report.isCoastal && (
            <div className="pb-1 flex flex-col gap-1.5">
              {/* Rating badge */}
              <div
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                style={{ backgroundColor: rating.bgColor, color: rating.textColor, border: `1px solid ${rating.color}30` }}
              >
                {rating.label}
              </div>
              {/* Period */}
              {current.wavePeriod > 0 && (
                <div className="text-xs text-slate-400">
                  {current.wavePeriod.toFixed(0)}s period
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: weather summary */}
        <div className="sm:ml-auto flex flex-wrap gap-3 sm:gap-4">
          <StatPill
            icon={<WeatherIcon code={current.weatherCode} size={16} />}
            value={current.weatherDescription}
          />
          <StatPill
            icon={<Thermometer size={14} className="text-orange-400" />}
            value={formatTemp(current.airTemp, units.temp)}
            label="air"
          />
          {current.waterTemp !== null && (
            <StatPill
              icon={<Droplets size={14} className="text-sky-400" />}
              value={formatTemp(current.waterTemp, units.temp)}
              label="water"
            />
          )}
          <StatPill
            icon={<Wind size={14} className="text-slate-400" />}
            value={`${Math.round(current.wind.speed)} km/h`}
            label={`${current.wind.directionLabel}`}
          />
        </div>
      </div>

      {/* Bottom divider row: key numbers */}
      {report.isCoastal && (
        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <MiniStat label="Primary Swell" value={formatWaveHeight(current.primarySwell.height, units.height)} />
          <MiniStat label="Swell Period" value={`${current.primarySwell.period.toFixed(0)}s`} />
          <MiniStat label="Swell Dir" value={current.primarySwell.directionLabel} />
          <MiniStat label="Wind" value={`${Math.round(current.wind.speed)} km/h`} />
          <MiniStat label="Wind Gust" value={`${Math.round(current.wind.gust)} km/h`} />
          <MiniStat label="UV Index" value={current.uvIndex > 0 ? current.uvIndex.toFixed(0) : '—'} uvVal={current.uvIndex} />
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
      <span className="text-sm font-semibold" style={{ color: uvColor ?? 'white' }}>{value}</span>
    </div>
  )
}

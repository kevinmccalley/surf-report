'use client'

import type { BuoyReading } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { Anchor } from 'lucide-react'

interface Props {
  buoy: BuoyReading & { waveDirectionLabel?: string | null; windDirectionLabel?: string | null }
  modelWaveHeight: number
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

function ageLabel(observedAt: string): string {
  const diffMs = Date.now() - new Date(observedAt).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)}h ago`
}

export default function BuoyCard({ buoy, modelWaveHeight, units }: Props) {
  const { t } = useLanguage()

  const buoyFmt = formatWaveHeight(buoy.waveHeight, units.height)
  const modelFmt = formatWaveHeight(modelWaveHeight, units.height)

  // Agreement indicator: how different is buoy vs model?
  const pct = modelWaveHeight > 0
    ? Math.round(Math.abs(buoy.waveHeight - modelWaveHeight) / modelWaveHeight * 100)
    : 0
  const higher = buoy.waveHeight > modelWaveHeight

  let agreementText: string
  let agreementColor: string
  if (pct <= 20) {
    agreementText = t('buoy.agreement')
    agreementColor = '#22c55e'
  } else if (higher) {
    agreementText = t('buoy.diffHigher', { pct: pct.toString() })
    agreementColor = '#f59e0b'
  } else {
    agreementText = t('buoy.diffLower', { pct: pct.toString() })
    agreementColor = '#f59e0b'
  }

  const stationUrl = `https://www.ndbc.noaa.gov/station_page.php?station=${buoy.stationId}`

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Anchor size={13} className="text-sky-400 shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {t('buoy.title')}
          </h2>
        </div>
        <a
          href={stationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
        >
          {buoy.stationId} →
        </a>
      </div>

      {/* Wave comparison — primary content */}
      <div className="flex items-center gap-4 sm:gap-6 mb-4">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-bold text-sky-400 leading-none">{buoyFmt}</div>
          <div className="text-xs text-slate-500 mt-1">{t('buoy.measured')}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-slate-600 text-xs font-medium">vs</div>
          <div className="text-xs text-center leading-tight" style={{ color: agreementColor }}>
            {agreementText}
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-bold text-slate-300 leading-none">{modelFmt}</div>
          <div className="text-xs text-slate-500 mt-1">{t('buoy.modelForecast')}</div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
        {buoy.wavePeriod !== null && (
          <Stat label={t('buoy.period')} value={`${buoy.wavePeriod}s`} />
        )}
        {buoy.waveDirectionLabel && (
          <Stat label={t('buoy.direction')} value={t('dir.' + buoy.waveDirectionLabel)} />
        )}
        {buoy.waterTemp !== null && (
          <Stat label={t('buoy.waterTemp')} value={formatTemp(buoy.waterTemp, units.temp)} />
        )}
        {buoy.windSpeed !== null && buoy.windDirectionLabel && (
          <Stat
            label={t('buoy.wind')}
            value={`${buoy.windSpeed} km/h ${t('dir.' + buoy.windDirectionLabel)}`}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
        <span>
          {buoy.stationName} · {t('buoy.offshore', { dist: buoy.distanceKm.toString() })}
        </span>
        <span>{ageLabel(buoy.observedAt)} · {t('buoy.source')}</span>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

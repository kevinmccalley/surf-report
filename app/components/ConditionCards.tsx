'use client'

import type { SurfReport } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { Wind, Droplets, Sun, Eye } from 'lucide-react'
import SwellCompass from './SwellCompass'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  report: SurfReport
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
}

export default function ConditionCards({ report, units }: Props) {
  const { t } = useLanguage()
  const { current } = report

  const windCategory =
    current.wind.speed < 8  ? t('cards.wind.glassy')   :
    current.wind.speed < 15 ? t('cards.wind.light')    :
    current.wind.speed < 25 ? t('cards.wind.moderate') :
    current.wind.speed < 40 ? t('cards.wind.strong')   : t('cards.wind.storm')

  const windCategoryColor =
    current.wind.speed < 8  ? '#22c55e' :
    current.wind.speed < 15 ? '#84cc16' :
    current.wind.speed < 25 ? '#eab308' :
    current.wind.speed < 40 ? '#f97316' : '#ef4444'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Swell Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-4 col-span-2 sm:col-span-1 lg:col-span-1">
        <CardLabel>{t('cards.swell')}</CardLabel>
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <SwellRow
              label={t('cards.primary')}
              height={formatWaveHeight(current.primarySwell.height, units.height)}
              period={`${current.primarySwell.period.toFixed(0)}s`}
              from={`${t('cards.from')} ${t('dir.' + current.primarySwell.directionLabel)}`}
              color="#0ea5e9"
            />
            {current.secondarySwell && (
              <SwellRow
                label={t('cards.windSwell')}
                height={formatWaveHeight(current.secondarySwell.height, units.height)}
                period={`${current.secondarySwell.period.toFixed(0)}s`}
                from={`${t('cards.from')} ${t('dir.' + current.secondarySwell.directionLabel)}`}
                color="#64748b"
              />
            )}
          </div>
          <div className="ml-2 shrink-0">
            <SwellCompass
              primaryDirection={current.primarySwell.direction}
              secondaryDirection={current.secondarySwell?.direction}
              size={90}
            />
          </div>
        </div>
      </div>

      {/* Wind Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-4">
        <CardLabel>{t('cards.wind')}</CardLabel>
        <WindDisplay
          speed={current.wind.speed}
          gust={current.wind.gust}
          directionLabel={t('dir.' + current.wind.directionLabel)}
          direction={current.wind.direction}
          gustLabel={t('cards.gusts')}
          conditionsLabel={t('cards.conditions')}
          windCategory={windCategory}
          windCategoryColor={windCategoryColor}
        />
      </div>

      {/* Water + Air Temp */}
      <div className="glass-card glass-card-hover rounded-2xl p-4">
        <CardLabel>{t('cards.conditions')}</CardLabel>
        <div className="space-y-3 mt-1">
          {current.waterTemp !== null && (
            <CondRow
              icon={<Droplets size={14} className="text-sky-400" />}
              label={t('cards.water')}
              value={formatTemp(current.waterTemp, units.temp)}
            />
          )}
          <CondRow
            icon={<span className="text-base leading-none">🌡</span>}
            label={t('cards.air')}
            value={formatTemp(current.airTemp, units.temp)}
          />
          {current.uvIndex > 0 && (
            <CondRow
              icon={<Sun size={14} style={{ color: uvColor(current.uvIndex) }} />}
              label={t('cards.uvIndex')}
              value={`${current.uvIndex.toFixed(0)} ${uvLabel(current.uvIndex, t)}`}
            />
          )}
          {current.visibility > 0 && (
            <CondRow
              icon={<Eye size={14} className="text-slate-400" />}
              label={t('cards.visibility')}
              value={`${current.visibility.toFixed(0)} km`}
            />
          )}
        </div>
      </div>

      {/* Sky / Weather */}
      <div className="glass-card glass-card-hover rounded-2xl p-4">
        <CardLabel>{t('cards.sky')}</CardLabel>
        <div className="mt-1 space-y-3">
          <div>
            <p className="text-xl mt-1">{weatherEmoji(current.weatherCode)}</p>
            <p className="text-sm font-medium text-white mt-1">{t('weather.' + current.weatherCode)}</p>
          </div>
          {current.precipProbability > 0 && (
            <CondRow
              icon={<Droplets size={13} className="text-blue-400" />}
              label={t('cards.rainChance')}
              value={`${current.precipProbability}%`}
            />
          )}
          <CondRow
            icon={<Wind size={13} className="text-slate-400" />}
            label={t('cards.gusts')}
            value={`${Math.round(current.wind.gust)} km/h`}
          />
        </div>
      </div>
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">{children}</p>
}

function SwellRow({ label, height, period, from, color }: {
  label: string; height: string; period: string; from: string; color: string
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold" style={{ color }}>{height}</span>
        <span className="text-xs text-slate-400">{period}</span>
        <span className="text-xs text-slate-500">{from}</span>
      </div>
    </div>
  )
}

function WindDisplay({ speed, gust, direction, directionLabel, gustLabel, conditionsLabel, windCategory, windCategoryColor }: {
  speed: number; gust: number; direction: number; directionLabel: string
  gustLabel: string; conditionsLabel: string; windCategory: string; windCategoryColor: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0"
          style={{ transform: `rotate(${(direction + 180) % 360}deg)` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14 L8 2 M5 5 L8 2 L11 5" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{Math.round(speed)}</span>
            <span className="text-xs text-slate-400">km/h</span>
          </div>
          <p className="text-xs text-slate-400">{directionLabel}</p>
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{gustLabel}</span>
        <span className="text-slate-300 font-medium">{Math.round(gust)} km/h</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{conditionsLabel}</span>
        <span className="font-medium" style={{ color: windCategoryColor }}>{windCategory}</span>
      </div>
    </div>
  )
}

function CondRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

function uvColor(uv: number): string {
  if (uv <= 2) return '#22c55e'
  if (uv <= 5) return '#eab308'
  if (uv <= 7) return '#f97316'
  if (uv <= 10) return '#ef4444'
  return '#a855f7'
}

function uvLabel(uv: number, t: (k: string) => string): string {
  if (uv <= 2) return t('cards.uv.low')
  if (uv <= 5) return t('cards.uv.moderate')
  if (uv <= 7) return t('cards.uv.high')
  if (uv <= 10) return t('cards.uv.veryHigh')
  return t('cards.uv.extreme')
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫'
  if (code <= 55) return '🌦'
  if (code <= 65) return '🌧'
  if (code <= 77) return '🌨'
  if (code <= 82) return '🌦'
  if (code <= 86) return '🌨'
  return '⛈'
}

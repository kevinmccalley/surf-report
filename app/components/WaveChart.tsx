'use client'

import { useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import type { HourlyForecast } from '@/app/lib/types'
import { formatHour, getDirectionLabel } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { TFn } from '@/app/i18n/LanguageContext'

interface Props {
  hourly: HourlyForecast[]
  heightUnit: 'ft' | 'm'
  tideHeights?: number[]
}

interface ChartPoint {
  time: string
  displayLabel: string
  waveHeightDisplay: number
  waveHeightM: number
  windSpeed: number
  windSpeedScaled: number
  period: number
  tideDisplay?: number
  primarySwellDisplay: number
  swellPeriod: number
  swellDirKey: string
  windWaveDisplay: number
  windWavePeriod: number
  windWaveDirKey: string
  swell2Display: number
  swell2Period: number
  swell2DirKey: string
  swell3Display: number
  swell3Period: number
  swell3DirKey: string
}

function toDisplay(meters: number, unit: 'ft' | 'm'): number {
  if (unit === 'ft') return Math.round(meters * 3.281 * 10) / 10
  return Math.round(meters * 10) / 10
}

export default function WaveChart({ hourly, heightUnit, tideHeights }: Props) {
  const { t } = useLanguage()
  const hasTide = tideHeights && tideHeights.length > 0
  const [showWave, setShowWave]   = useState(true)
  const [showWind, setShowWind]   = useState(true)
  const [showSwells, setShowSwells] = useState(false)

  const maxWave = Math.max(...hourly.map(h => toDisplay(h.waveHeight, heightUnit)), 1)
  const maxWind = Math.max(...hourly.map(h => Math.round(h.windSpeed)), 1)
  const waveYMax = Math.max(Math.ceil((maxWave + 2) / 2) * 2, 4)

  const hasWindWave = hourly.some(h => h.windWaveHeight > 0.1)
  const hasSwell2   = hourly.some(h => h.swell2Height > 0.1)
  const hasSwell3   = hourly.some(h => h.swell3Height > 0.1)

  const data: ChartPoint[] = hourly.map((h, i) => {
    const windSpeed = Math.round(h.windSpeed)
    return {
      time: h.time,
      displayLabel: i % 6 === 0 ? formatHour(h.time) : '',
      waveHeightDisplay: toDisplay(h.waveHeight, heightUnit),
      waveHeightM: h.waveHeight,
      windSpeed,
      windSpeedScaled: (windSpeed / maxWind) * waveYMax * 0.65,
      period: Math.round(h.wavePeriod),
      tideDisplay: hasTide && tideHeights[i] !== undefined
        ? toDisplay(tideHeights[i], heightUnit)
        : undefined,
      primarySwellDisplay: toDisplay(h.swellHeight, heightUnit),
      swellPeriod: Math.round(h.swellPeriod),
      swellDirKey: getDirectionLabel(h.swellDirection),
      windWaveDisplay: toDisplay(h.windWaveHeight, heightUnit),
      windWavePeriod: Math.round(h.windWavePeriod),
      windWaveDirKey: getDirectionLabel(h.windWaveDirection),
      swell2Display: toDisplay(h.swell2Height, heightUnit),
      swell2Period: Math.round(h.swell2Period),
      swell2DirKey: getDirectionLabel(h.swell2Direction),
      swell3Display: toDisplay(h.swell3Height, heightUnit),
      swell3Period: Math.round(h.swell3Period),
      swell3DirKey: getDirectionLabel(h.swell3Direction),
    }
  })

  const tidePts = data.map(d => d.tideDisplay).filter((v): v is number => v !== undefined)
  const tideMin = tidePts.length ? Math.min(...tidePts) : 0
  const tideMax = tidePts.length ? Math.max(...tidePts) : 1
  const tidePad = Math.max((tideMax - tideMin) * 0.15, 0.2)
  const tideYMin = Math.floor((tideMin - tidePad) * 10) / 10
  const tideYMax = Math.ceil((tideMax + tidePad) * 10) / 10

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs px-1">
        <ToggleItem
          color="#0ea5e9" label={t('chart.waveHeight')}
          checked={showWave} onChange={() => setShowWave(v => !v)}
        />
        <ToggleItem
          color="rgba(100,116,139,0.7)" label={t('chart.windSpeed')} dashed
          checked={showWind} onChange={() => setShowWind(v => !v)}
        />
        <ToggleItem
          color="#22d3ee" label={t('chart.swellComponents')}
          checked={showSwells} onChange={() => setShowSwells(v => !v)}
          multiColor={showSwells ? [
            '#22d3ee',
            ...(hasWindWave ? ['#94a3b8'] : []),
            ...(hasSwell2   ? ['#f59e0b'] : []),
            ...(hasSwell3   ? ['#a78bfa'] : []),
          ] : undefined}
        />
        {hasTide && <LegendDot color="#2dd4bf" label={t('chart.tideHeight')} />}
      </div>

      <div className="w-full h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: hasTide ? 48 : 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="windGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis yAxisId="wave" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, waveYMax]} tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`} width={42} />
            {hasTide && (
              <YAxis yAxisId="tide" orientation="right" tick={{ fill: '#2dd4bf', fontSize: 10 }} axisLine={false} tickLine={false} domain={[tideYMin, tideYMax]} tickFormatter={(v: number) => heightUnit === 'ft' ? `${v}ft` : `${v}m`} width={40} />
            )}

            <Tooltip content={
              <CustomTooltip
                heightUnit={heightUnit} hasTide={hasTide ?? false}
                showSwells={showSwells}
                hasWindWave={hasWindWave} hasSwell2={hasSwell2} hasSwell3={hasSwell3}
                t={t}
              />
            } />

            {showWind && (
              <Area yAxisId="wave" type="monotone" dataKey="windSpeedScaled" stroke="rgba(100,116,139,0.45)" strokeWidth={1} fill="url(#windGrad2)" strokeDasharray="3 2" dot={false} activeDot={false} />
            )}
            {showWave && (
              <Area yAxisId="wave" type="monotone" dataKey="waveHeightDisplay" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#waveGrad2)" dot={false} activeDot={{ r: 4, fill: '#0ea5e9', stroke: 'white', strokeWidth: 1.5 }} />
            )}
            <Line hide={!showSwells} yAxisId="wave" type="monotone" dataKey="primarySwellDisplay" stroke="#22d3ee" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#22d3ee', stroke: 'white', strokeWidth: 1 }} />
            <Line hide={!showSwells || !hasWindWave} yAxisId="wave" type="monotone" dataKey="windWaveDisplay" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 3" dot={false} activeDot={{ r: 3, fill: '#94a3b8', stroke: 'white', strokeWidth: 1 }} />
            <Line hide={!showSwells || !hasSwell2} yAxisId="wave" type="monotone" dataKey="swell2Display" stroke="#f59e0b" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#f59e0b', stroke: 'white', strokeWidth: 1 }} />
            <Line hide={!showSwells || !hasSwell3} yAxisId="wave" type="monotone" dataKey="swell3Display" stroke="#a78bfa" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#a78bfa', stroke: 'white', strokeWidth: 1 }} />
            {hasTide && (
              <Line yAxisId="tide" type="monotone" dataKey="tideDisplay" stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 3.5, fill: '#2dd4bf', stroke: 'white', strokeWidth: 1.5 }} strokeDasharray="none" />
            )}
            <ReferenceLine yAxisId="wave" x={data[0]?.displayLabel} stroke="rgba(14,165,233,0.4)" strokeWidth={1.5} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ToggleItem({ color, label, dashed, checked, onChange, multiColor }: {
  color: string; label: string; dashed?: boolean; checked: boolean; onChange: () => void
  multiColor?: string[]
}) {
  return (
    <button onClick={onChange} className="flex items-center gap-1.5 transition-opacity" style={{ opacity: checked ? 1 : 0.35 }}>
      {multiColor && checked ? (
        <span className="flex gap-0.5">
          {multiColor.map((c, i) => (
            <span key={i} className="w-2 h-0.5 rounded-full inline-block" style={{ backgroundColor: c }} />
          ))}
        </span>
      ) : dashed ? (
        <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
      ) : (
        <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      )}
      <span className="text-slate-500">{label}</span>
    </button>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

function CustomTooltip({ active, payload, heightUnit, hasTide, showSwells, hasWindWave, hasSwell2, hasSwell3, t }: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  heightUnit: 'ft' | 'm'
  hasTide: boolean
  showSwells: boolean
  hasWindWave: boolean
  hasSwell2: boolean
  hasSwell3: boolean
  t: TFn
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  const fmt = (m: number) => heightUnit === 'ft' ? `${m}ft` : `${m}m`

  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{formatHour(d.time)}</p>
      <div className="space-y-1">
        <Row color="#0ea5e9" label={t('chart.waves')} value={heightUnit === 'ft' ? `${d.waveHeightDisplay}ft` : `${d.waveHeightM.toFixed(1)}m`} />
        {d.period > 0 && <Row color="#7dd3fc" label={t('chart.period')} value={`${d.period}s`} />}
        {showSwells && d.primarySwellDisplay > 0 && (
          <Row color="#22d3ee" label={t('chart.primarySwell')}
            value={`${fmt(d.primarySwellDisplay)}${d.swellPeriod > 0 ? ` · ${d.swellPeriod}s` : ''} · ${t('dir.' + d.swellDirKey)}`} />
        )}
        {showSwells && hasWindWave && d.windWaveDisplay > 0 && (
          <Row color="#94a3b8" label={t('chart.windWave')}
            value={`${fmt(d.windWaveDisplay)}${d.windWavePeriod > 0 ? ` · ${d.windWavePeriod}s` : ''}`} />
        )}
        {showSwells && hasSwell2 && d.swell2Display > 0 && (
          <Row color="#f59e0b" label={t('chart.swell2')}
            value={`${fmt(d.swell2Display)}${d.swell2Period > 0 ? ` · ${d.swell2Period}s` : ''} · ${t('dir.' + d.swell2DirKey)}`} />
        )}
        {showSwells && hasSwell3 && d.swell3Display > 0 && (
          <Row color="#a78bfa" label={t('chart.swell3')}
            value={`${fmt(d.swell3Display)}${d.swell3Period > 0 ? ` · ${d.swell3Period}s` : ''} · ${t('dir.' + d.swell3DirKey)}`} />
        )}
        <Row color="rgba(100,116,139,0.7)" label={t('chart.wind')} value={`${d.windSpeed} km/h`} />
        {hasTide && d.tideDisplay !== undefined && (
          <Row color="#2dd4bf" label={t('chart.tide')} value={heightUnit === 'ft' ? `${d.tideDisplay}ft` : `${d.tideDisplay}m`} />
        )}
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold ml-auto pl-4">{value}</span>
    </div>
  )
}

'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Wind, Waves } from 'lucide-react'
import type { SurfReport, NearbySpot } from '@/app/lib/types'
import { formatWaveHeight, formatTemp } from '@/app/lib/utils'
import { useLanguage } from '@/app/i18n/LanguageContext'

const SurfMap = dynamic(() => import('./SurfMap'), { ssr: false, loading: () => <MapSkeleton /> })

interface Props {
  report: SurfReport
  units: { temp: 'c' | 'f'; height: 'ft' | 'm' }
  onClose: () => void
  nearbySpots?: NearbySpot[]
  onSpotSelect?: (spot: NearbySpot) => void
}

export default function MapPanel({ report, units, onClose, nearbySpots, onSpotSelect }: Props) {
  const { t } = useLanguage()
  const { current, location } = report
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set())

  const toggleLayer = (key: string) =>
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose} aria-hidden
      />

      {/* Sliding panel */}
      <motion.aside
        key="panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] z-50 flex flex-col"
        style={{ background: 'var(--panel-bg)', borderLeft: '1px solid var(--card-border)' }}
        aria-label={t('map.panelLabel')}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-white/5 shrink-0"
          style={{ borderBottomColor: 'var(--card-border)' }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate">{location.name}</h2>
            {location.country && <p className="text-xs text-slate-500 truncate">{location.country}</p>}
          </div>
          <button onClick={onClose} aria-label={t('map.close')}
            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Rating + wave stats strip */}
        {report.isCoastal && (
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 shrink-0"
            style={{ borderBottomColor: 'var(--card-border)' }}>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{ backgroundColor: current.rating.bgColor, border: `1px solid ${current.rating.color}30`, color: current.rating.color }}>
              {t('rating.' + current.rating.label.replace(/ /g, '_'))}
            </span>
            <span className="text-white font-semibold tabular-nums">
              {formatWaveHeight(current.waveHeight, units.height)}
            </span>
            {current.wavePeriod > 0 && (
              <span className="text-slate-500 text-sm">{current.wavePeriod.toFixed(0)}s period</span>
            )}
          </div>
        )}

        {/* Map — fills remaining space */}
        <div className="flex-1 min-h-0 relative">
          <SurfMap
            report={report}
            units={{ height: units.height }}
            highlightLayers={activeLayers}
            nearbySpots={nearbySpots}
            onSpotSelect={onSpotSelect}
          />

          {/* Clickable legend — click to isolate a layer */}
          {report.isCoastal && (
            <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1">
              {current.primarySwell.height > 0.05 && (
                <LegendItem
                  color="var(--accent)"
                  label={`${t('map.swell')}: ${t('dir.' + current.primarySwell.directionLabel)}`}
                  active={activeLayers.has('primary')}
                  dimmed={activeLayers.size > 0 && !activeLayers.has('primary')}
                  onClick={() => toggleLayer('primary')}
                />
              )}
              {current.secondarySwell && current.secondarySwell.height > 0.1 && (
                <LegendItem
                  color="#94a3b8"
                  label={`${t('map.windWave')}: ${t('dir.' + current.secondarySwell.directionLabel)}`}
                  dashed
                  active={activeLayers.has('secondary')}
                  dimmed={activeLayers.size > 0 && !activeLayers.has('secondary')}
                  onClick={() => toggleLayer('secondary')}
                />
              )}
              {current.wind.speed > 2 && (
                <LegendItem
                  color="#64748b"
                  label={`${t('map.wind')}: ${t('dir.' + current.wind.directionLabel)}`}
                  thin
                  active={activeLayers.has('wind')}
                  dimmed={activeLayers.size > 0 && !activeLayers.has('wind')}
                  onClick={() => toggleLayer('wind')}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer quick-stats */}
        <div className="shrink-0 grid grid-cols-3 divide-x divide-white/5 border-t border-white/5"
          style={{ borderTopColor: 'var(--card-border)' }}>
          <FooterStat
            icon={<Waves size={13} className="text-sky-400" />}
            label={t('map.primary')}
            value={formatWaveHeight(current.primarySwell.height, units.height)}
            sub={`${current.primarySwell.period.toFixed(0)}s · ${t('dir.' + current.primarySwell.directionLabel)}`}
          />
          <FooterStat
            icon={<Wind size={13} className="text-slate-400" />}
            label={t('map.windLabel')}
            value={`${Math.round(current.wind.speed)} km/h`}
            sub={t('dir.' + current.wind.directionLabel)}
          />
          <FooterStat
            label={t('map.water')}
            value={current.waterTemp !== null ? formatTemp(current.waterTemp, units.temp) : '—'}
            sub={`${formatTemp(current.airTemp, units.temp)} ${t('map.air')}`}
          />
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

function LegendItem({
  color, label, dashed, thin, active, dimmed, onClick,
}: {
  color: string; label: string; dashed?: boolean; thin?: boolean
  active?: boolean; dimmed?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 backdrop-blur-sm transition-all duration-200 text-left ${
        dimmed ? 'opacity-25' : active ? 'opacity-100' : 'opacity-70 hover:opacity-100'
      }`}
      style={{ background: 'var(--panel-bg)', cursor: 'pointer' }}
    >
      <svg width="16" height="8" className="shrink-0">
        <line
          x1="0" y1="4" x2="16" y2="4"
          stroke={color}
          strokeWidth={active ? (thin ? 2 : 2.5) : (thin ? 1 : 1.5)}
          strokeDasharray={dashed ? '3 2' : undefined}
          strokeOpacity={dimmed ? 0.5 : 0.9}
        />
      </svg>
      <span className={`text-[10px] transition-colors ${
        active ? 'text-white font-semibold' : dimmed ? 'text-slate-600' : 'text-slate-400'
      }`}>
        {label}
      </span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      )}
    </button>
  )
}

function FooterStat({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
        {icon}<span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
      <span className="text-[11px] text-slate-500">{sub}</span>
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-pulse" style={{ background: 'var(--search-bg)' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-slate-400">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 20 C10 16, 13 22, 16 18 C19 14, 22 20, 24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}

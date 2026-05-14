'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useUser } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { DayForecast } from '@/app/lib/types'
import { formatWaveRange } from '@/app/lib/utils'
import type { Top100Spot } from './spots-data'

const SimpleSpotMap = dynamic(() => import('./SimpleSpotMap'), { ssr: false })

const DIRECTION_ARROWS: Record<string, string> = {
  N: '↑', NNE: '↑', NE: '↗', ENE: '↗',
  E: '→', ESE: '↘', SE: '↘', SSE: '↓',
  S: '↓', SSW: '↓', SW: '↙', WSW: '↙',
  W: '←', WNW: '↖', NW: '↖', NNW: '↑',
}

function waveTypeKey(waveType: string): string {
  if (waveType === 'Reef Break') return 'top100.waveType.reef'
  if (waveType === 'Beach Break') return 'top100.waveType.beach'
  if (waveType === 'Point Break') return 'top100.waveType.point'
  if (waveType === 'River Mouth') return 'top100.waveType.river'
  return 'top100.waveType.sandbar'
}

function difficultyKey(d: string): string {
  const map: Record<string, string> = {
    Beginner: 'top100.difficulty.beginner',
    Intermediate: 'top100.difficulty.intermediate',
    Advanced: 'top100.difficulty.advanced',
    Expert: 'top100.difficulty.expert',
  }
  return map[d] ?? 'top100.difficulty.advanced'
}

function difficultyColor(d: string): string {
  if (d === 'Beginner') return '#22c55e'
  if (d === 'Intermediate') return '#3b82f6'
  if (d === 'Advanced') return '#f59e0b'
  return '#ef4444'
}

interface MiniDay {
  label: string
  heightRange: string
  dirArrow: string
  period: number
  ratingLabel: string
  ratingBg: string
  firing: boolean
}

interface Props {
  spot: Top100Spot
  heightUnit: 'ft' | 'm'
}

export default function SpotRow({ spot, heightUnit }: Props) {
  const { t } = useLanguage()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const rowRef = useRef<HTMLDivElement>(null)

  const [today, setToday] = useState<MiniDay | null>(null)
  const [tomorrow, setTomorrow] = useState<MiniDay | null>(null)
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mapOpen, setMapOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showCoords, setShowCoords] = useState(false)

  // Check if already saved
  useEffect(() => {
    if (!user) return
    const locations = (user.publicMetadata?.savedLocations as { lat: number; lon: number }[] | undefined) ?? []
    setSaved(locations.some(l => Math.abs(l.lat - spot.lat) < 0.001 && Math.abs(l.lon - spot.lon) < 0.001))
  }, [user, spot.lat, spot.lon])

  const toMiniDay = useCallback((day: DayForecast, label: string): MiniDay => ({
    label,
    heightRange: formatWaveRange(day.waveHeightMin, day.waveHeightMax, heightUnit),
    dirArrow: DIRECTION_ARROWS[day.swellDirectionLabel] ?? '↗',
    period: Math.round(day.wavePeriodMax),
    ratingLabel: day.rating.label,
    ratingBg: day.rating.bgColor,
    firing: day.waveHeightMax >= 1.2 && day.rating.score >= 5,
  }), [heightUnit])

  // Lazy load via IntersectionObserver
  useEffect(() => {
    if (fetched) return
    const el = rowRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          setLoading(true)
          fetch(`/api/surf?lat=${spot.lat}&lon=${spot.lon}&name=${encodeURIComponent(spot.name)}&country=${encodeURIComponent(spot.country)}`)
            .then(r => r.json())
            .then(report => {
              const days: DayForecast[] = report.forecast ?? []
              if (days[0]) setToday(toMiniDay(days[0], t('top100.today')))
              if (days[1]) setTomorrow(toMiniDay(days[1], t('top100.tomorrow')))
            })
            .catch(() => {})
            .finally(() => {
              setFetched(true)
              setLoading(false)
            })
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetched, spot.lat, spot.lon, spot.name, spot.country, t, toMiniDay])

  const handleSave = async () => {
    if (!isSignedIn) return
    setSaveLoading(true)
    try {
      if (saved) {
        await fetch('/api/locations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: spot.lat, lon: spot.lon }),
        })
        setSaved(false)
      } else {
        const res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: spot.name,
            country: spot.country,
            displayName: `${spot.name}, ${spot.locality}`,
            lat: spot.lat,
            lon: spot.lon,
          }),
        })
        if (res.ok) {
          setSaved(true)
          await user?.reload()
        }
      }
    } catch {}
    setSaveLoading(false)
  }

  const firing = today?.firing

  return (
    <div ref={rowRef} className="group relative glass-card rounded-2xl border transition-all duration-200"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

      {/* Firing glow */}
      {firing && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.35), 0 0 20px -4px rgba(34,197,94,0.15)' }} />
      )}

      <div className="p-4 sm:p-5 grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:gap-5">

        {/* ── Left: rank + name ──────────────────────────────────────────── */}
        <div className="flex gap-3 items-start min-w-0 lg:max-w-[280px]">
          <span className="text-2xl font-black tabular-nums leading-none mt-0.5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.15)', minWidth: '2.2rem' }}>
            {spot.rank}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-100 text-base leading-tight">{spot.name}</h3>
              {firing && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {t('top100.firing')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{spot.locality} · {spot.country}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#cbd5e1' }}>
                {t(waveTypeKey(spot.waveType))}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${difficultyColor(spot.difficulty)}22`, color: difficultyColor(spot.difficulty) }}>
                {t(difficultyKey(spot.difficulty))}
              </span>
              {spot.wslBadge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                  {spot.wslBadge === 'CT Stop' ? t('top100.badge.ct') : t('top100.badge.bigwave')}
                </span>
              )}
            </div>

            {/* Season + map icon */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-slate-500">
                {t('top100.bestSeason', { season: spot.bestSeason })}
              </span>
              <div className="relative">
                <button
                  onClick={() => setMapOpen(true)}
                  onMouseEnter={() => setShowCoords(true)}
                  onMouseLeave={() => setShowCoords(false)}
                  className="text-slate-500 hover:text-sky-400 transition-colors text-sm leading-none"
                  aria-label={t('top100.viewMap')}
                >
                  📍
                </button>
                {showCoords && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none"
                    style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {Math.abs(spot.lat).toFixed(4)}°{spot.lat >= 0 ? 'N' : 'S'}, {Math.abs(spot.lon).toFixed(4)}°{spot.lon >= 0 ? 'E' : 'W'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: forecast strip ─────────────────────────────────────── */}
        <div className="flex gap-3 sm:gap-4 items-start">
          {loading && !fetched ? (
            <div className="flex gap-3">
              {[0, 1].map(i => (
                <div key={i} className="w-28 h-16 rounded-xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : today || tomorrow ? (
            [today, tomorrow].map((day, i) => day && (
              <div key={i} className="rounded-xl px-3 py-2.5 min-w-[7rem]"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{day.label}</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: day.ratingBg }} />
                  <span className="text-sm font-bold text-slate-100">{day.heightRange}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {day.dirArrow} {day.period}s
                </p>
                <p className="text-[10px] mt-0.5 font-medium capitalize"
                  style={{ color: day.ratingBg }}>
                  {day.ratingLabel.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            ))
          ) : fetched ? (
            <p className="text-xs text-slate-600 self-center">{t('top100.noData')}</p>
          ) : null}
        </div>

        {/* ── Right: description + bookmark ─────────────────────────────── */}
        <div className="lg:max-w-[340px] flex flex-col gap-2">
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">{spot.description}</p>

          {/* Bookmark */}
          <div className="relative self-end mt-auto">
            {isSignedIn ? (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="text-lg leading-none transition-all duration-200 hover:scale-110 disabled:opacity-50"
                title={saved ? t('top100.saved') : t('top100.saveSpot')}
              >
                {saved ? '🔖' : '🏄'}
              </button>
            ) : (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-lg leading-none opacity-30 hover:opacity-50 transition-opacity"
                >
                  🏄
                </button>
                {showTooltip && (
                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap z-10 pointer-events-none"
                    style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {t('top100.signInToSave')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map modal */}
      {mapOpen && (
        <SimpleSpotMap
          lat={spot.lat}
          lon={spot.lon}
          name={spot.name}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  )
}

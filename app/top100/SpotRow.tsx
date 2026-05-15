'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { DayForecast, SurfReport, NearbySpot } from '@/app/lib/types'
import { formatWaveRange } from '@/app/lib/utils'
import type { Top100Spot } from './spots-data'

const MapPanel = dynamic(() => import('@/app/components/MapPanel'), { ssr: false })

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
  heightRange: string
  dirArrow: string
  period: number
  ratingLabel: string
  ratingBg: string
  ratingColor: string
  firing: boolean
}

interface Props {
  spot: Top100Spot
  heightUnit: 'ft' | 'm'
}

export default function SpotRow({ spot, heightUnit }: Props) {
  const { t, locale } = useLanguage()
  const description = spot.description[locale] ?? spot.description['en']
  const rowRef = useRef<HTMLDivElement>(null)
  const nearbyForRef = useRef<string | null>(null)

  const [today, setToday] = useState<MiniDay | null>(null)
  const [tomorrow, setTomorrow] = useState<MiniDay | null>(null)
  const [report, setReport] = useState<SurfReport | null>(null)
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([])
  const [showCoords, setShowCoords] = useState(false)

  const toMiniDay = useCallback((day: DayForecast): MiniDay => ({
    heightRange: formatWaveRange(day.waveHeightMin, day.waveHeightMax, heightUnit),
    dirArrow: DIRECTION_ARROWS[day.swellDirectionLabel] ?? '↗',
    period: Math.round(day.wavePeriodMax),
    ratingLabel: day.rating.label,
    ratingBg: day.rating.bgColor,
    ratingColor: day.rating.color,
    firing: day.waveHeightMax >= 1.2 && day.rating.score >= 5,
  }), [heightUnit])

  const doFetch = useCallback((lat: number, lon: number, name: string, country: string) => {
    setLoading(true)
    return fetch(`/api/surf?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}&country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then((r: SurfReport) => {
        setReport(r)
        const days: DayForecast[] = r.forecast ?? []
        if (days[0]) setToday(toMiniDay(days[0]))
        if (days[1]) setTomorrow(toMiniDay(days[1]))
        setFetched(true)
        return r
      })
      .catch(() => { setFetched(true) })
      .finally(() => setLoading(false))
  }, [toMiniDay])

  // Lazy-load forecast as row scrolls into view
  useEffect(() => {
    if (fetched) return
    const el = rowRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          doFetch(spot.lat, spot.lon, spot.name, spot.country)
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetched, spot.lat, spot.lon, spot.name, spot.country, doFetch])

  // Fetch nearby spots whenever the map is open and the active report location changes
  useEffect(() => {
    if (!mapOpen || !report) return
    const key = `${report.location.lat.toFixed(4)},${report.location.lon.toFixed(4)}`
    if (nearbyForRef.current === key) return
    nearbyForRef.current = key
    setNearbySpots([])
    fetch(`/api/nearby?lat=${report.location.lat}&lon=${report.location.lon}`)
      .then(r => r.ok ? r.json() : [])
      .then((spots: NearbySpot[]) => setNearbySpots(spots))
      .catch(() => {})
  }, [mapOpen, report])

  const handlePinClick = useCallback(() => {
    setMapOpen(true)
    if (!fetched && !loading) {
      doFetch(spot.lat, spot.lon, spot.name, spot.country)
    }
  }, [fetched, loading, spot, doFetch])

  // When user selects a nearby spot, swap report + forecast cards + trigger nearby re-fetch
  const handleSpotSelect = useCallback((nearby: NearbySpot) => {
    fetch(`/api/surf?lat=${nearby.lat}&lon=${nearby.lon}&name=${encodeURIComponent(nearby.name)}&country=`)
      .then(r => r.json())
      .then((r: SurfReport) => {
        setReport(r)
        const days: DayForecast[] = r.forecast ?? []
        if (days[0]) setToday(toMiniDay(days[0]))
        if (days[1]) setTomorrow(toMiniDay(days[1]))
      })
      .catch(() => {})
  }, [toMiniDay])

  const firing = today?.firing

  return (
    <div ref={rowRef} className="relative glass-card rounded-2xl transition-all duration-200">

      <div className="p-4 sm:p-5 grid gap-3 lg:grid-cols-[auto_1fr] lg:gap-5">

        {/* ── Left: name ─────────────────────────────────────────────────── */}
        <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base leading-tight">{spot.name}</h3>
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
            <p className="theme-label text-xs mt-0.5 truncate">{spot.locality} · {spot.country}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="theme-label text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--panel-hover)' }}>
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

            {/* Season + map pin */}
            <div className="flex items-center gap-3 mt-2">
              <span className="theme-label text-[11px]">
                {t('top100.bestSeason', { season: spot.bestSeason })}
              </span>
              <div className="relative">
                <button
                  onClick={handlePinClick}
                  onMouseEnter={() => setShowCoords(true)}
                  onMouseLeave={() => setShowCoords(false)}
                  className="leading-none transition-colors duration-150"
                  style={{ color: showCoords ? 'var(--accent)' : 'var(--panel-muted)' }}
                  aria-label={t('top100.viewMap')}
                >
                  <svg width="11" height="15" viewBox="0 0 12 16" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6 0C2.686 0 0 2.686 0 6c0 4.5 6 10 6 10s6-5.5 6-10C12 2.686 9.314 0 6 0zm0 8.5A2.5 2.5 0 1 1 6 3.5a2.5 2.5 0 0 1 0 5z"/>
                  </svg>
                </button>
                {showCoords && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none"
                    style={{ background: 'var(--panel-bg)', color: 'var(--panel-label)', border: '1px solid var(--card-border)' }}>
                    {Math.abs(spot.lat).toFixed(4)}°{spot.lat >= 0 ? 'N' : 'S'}, {Math.abs(spot.lon).toFixed(4)}°{spot.lon >= 0 ? 'E' : 'W'}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* ── Right: description + forecast strip ───────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">

          {/* Description */}
          <p className="theme-label text-xs leading-relaxed sm:flex-1 sm:min-w-0">{description}</p>

          {/* Forecast cards */}
          <div className="flex gap-2 items-start shrink-0">
            {loading && !fetched ? (
              <>
                {[0, 1].map(i => (
                  <div key={i} className="w-28 h-16 rounded-xl animate-pulse"
                    style={{ background: 'var(--panel-hover)' }} />
                ))}
              </>
            ) : today || tomorrow ? (
              [today, tomorrow].map((day, i) => day && (
                <div key={i} className="rounded-xl px-3 py-2.5 w-28"
                  style={{ background: 'var(--panel-hover)' }}>
                  <p className="theme-label-muted text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                    {i === 0 ? t('top100.today') : t('top100.tomorrow')}
                  </p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: day.ratingColor }} />
                    <span className="text-sm font-bold">{day.heightRange}</span>
                  </div>
                  <p className="theme-label text-[11px]">
                    {day.dirArrow} {day.period}s
                  </p>
                  <p className="rating-chip text-[10px] mt-0.5 font-medium capitalize"
                    data-rating={day.ratingLabel.replace(/ /g, '_')}>
                    {day.ratingLabel.toLowerCase().replace(/_/g, ' ')}
                  </p>
                </div>
              ))
            ) : fetched ? (
              <p className="theme-label-muted text-xs self-center">{t('top100.noData')}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Full MapPanel — same as main surf report */}
      {mapOpen && report && (
        <MapPanel
          report={report}
          units={{ temp: 'c', height: heightUnit }}
          onClose={() => setMapOpen(false)}
          nearbySpots={nearbySpots}
          onSpotSelect={handleSpotSelect}
        />
      )}
    </div>
  )
}

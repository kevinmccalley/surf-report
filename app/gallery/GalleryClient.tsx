'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import SearchBar from '@/app/components/SearchBar'
import ThemePicker from '@/app/components/ThemePicker'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import AuthButton from '@/app/components/AuthButton'
import { formatWaveRange } from '@/app/lib/utils'
import type { GeoResult } from '@/app/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface GalleryTileData {
  rank: number
  name: string
  locality: string
  country: string
  lat: number
  lon: number
  waveType: string
  difficulty: string
  bestSeason: string
  wslBadge?: string
  imageSrc: string | null
}

interface LiveConditions {
  height: string
  rating: string
  ratingColor: string
  dirArrow: string
  period: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const DIRECTION_ARROWS: Record<string, string> = {
  N: '↑', NNE: '↑', NE: '↗', ENE: '↗',
  E: '→', ESE: '↘', SE: '↘', SSE: '↓',
  S: '↓', SSW: '↓', SW: '↙', WSW: '↙',
  W: '←', WNW: '↖', NW: '↖', NNW: '↑',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:     '#22c55e',
  Intermediate: '#3b82f6',
  Advanced:     '#f59e0b',
  Expert:       '#ef4444',
}

// ── Header logo ────────────────────────────────────────────────────────────

function WaveLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

// ── Individual tile ─────────────────────────────────────────────────────────

function GalleryTile({ tile }: { tile: GalleryTileData }) {
  const [hovered, setHovered] = useState(false)
  const [live, setLive] = useState<LiveConditions | null>(null)
  const [loadingLive, setLoadingLive] = useState(false)
  const fetchedRef = useRef(false)

  const handleMouseEnter = () => {
    setHovered(true)
    if (fetchedRef.current) return
    fetchedRef.current = true
    setLoadingLive(true)
    fetch(
      `/api/surf?lat=${tile.lat}&lon=${tile.lon}` +
      `&name=${encodeURIComponent(tile.name)}&country=${encodeURIComponent(tile.country)}`
    )
      .then(r => r.json())
      .then(data => {
        const today = data?.forecast?.[0]
        if (today) {
          setLive({
            height:      formatWaveRange(today.waveHeightMin, today.waveHeightMax, 'ft'),
            rating:      today.rating.label,
            ratingColor: today.rating.color,
            dirArrow:    DIRECTION_ARROWS[today.swellDirectionLabel] ?? '↗',
            period:      Math.round(today.wavePeriodMax),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLive(false))
  }

  const href =
    `/?lat=${tile.lat}&lon=${tile.lon}` +
    `&name=${encodeURIComponent(tile.name)}` +
    `&country=${encodeURIComponent(tile.country)}`

  const diffColor = DIFFICULTY_COLOR[tile.difficulty] ?? '#f59e0b'

  return (
    <a
      href={href}
      className="relative block rounded-2xl overflow-hidden"
      style={{ aspectRatio: '271 / 178', background: 'var(--panel-hover)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleMouseEnter}
      onBlur={() => setHovered(false)}
    >
      {/* Photo */}
      {tile.imageSrc && (
        <Image
          src={tile.imageSrc}
          alt={tile.name}
          fill
          className="object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />
      )}

      {/* Hover tooltip overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end transition-opacity duration-200"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        {/* Gradient scrim so text is readable over photos */}
        <div className="absolute inset-0" style={{
          background: tile.imageSrc
            ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 100%)'
            : 'rgba(0,0,0,0.72)',
        }} />

        {/* Content — color forced via inline style so light themes can't override it */}
        <div className="relative px-2.5 pb-2.5 pt-6" style={{ color: 'white' }}>
          {/* Rank + name */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold opacity-60">#{tile.rank}</span>
            <span className="text-xs font-bold leading-tight">{tile.name}</span>
          </div>
          <p className="text-[10px] opacity-60 mt-0.5 leading-tight">
            {tile.locality} · {tile.country}
          </p>

          {/* Tags */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              {tile.waveType}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${diffColor}33`, color: diffColor }}>
              {tile.difficulty}
            </span>
            {tile.wslBadge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                {tile.wslBadge}
              </span>
            )}
          </div>

          {/* Divider + conditions */}
          <div className="mt-1.5 pt-1.5 border-t border-white/20">
            {loadingLive ? (
              <p className="text-[9px] opacity-40">Loading conditions…</p>
            ) : live ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: live.ratingColor }} />
                <span className="text-[10px] font-bold">{live.height}</span>
                <span className="text-[9px] opacity-70">
                  {live.dirArrow} {live.period}s
                </span>
                <span className="text-[9px] opacity-70 capitalize">
                  · {live.rating.toLowerCase().replace(/_/g, ' ')}
                </span>
              </div>
            ) : (
              <p className="text-[9px] opacity-50">Best: {tile.bestSeason}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rank badge always visible on blank tiles (no photo) */}
      {!tile.imageSrc && !hovered && (
        <div className="absolute top-2 left-2.5">
          <span className="text-[10px] font-bold" style={{ color: 'var(--panel-muted)' }}>
            #{tile.rank}
          </span>
        </div>
      )}
    </a>
  )
}

// ── Main client component ──────────────────────────────────────────────────

interface Props {
  tiles: GalleryTileData[]
}

export default function GalleryClient({ tiles }: Props) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback((result: GeoResult) => {
    router.push(
      `/?lat=${result.lat}&lon=${result.lon}` +
      `&name=${encodeURIComponent(result.name)}` +
      `&country=${encodeURIComponent(result.country ?? '')}`
    )
  }, [router])

  return (
    <div className="theme-bg min-h-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 theme-header">
        <div ref={menuRef}>
          <div className="px-4 py-3 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <WaveLogo />
              <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
                Groundswell
              </span>
            </a>

            <div className="flex-1 sm:max-w-xl">
              <SearchBar onSelect={handleSelect} compact />
            </div>

            <div className="hidden sm:flex items-center gap-1 shrink-0 ml-auto">
              <LanguageSwitcher />
              <ThemePicker />
              <AuthButton subscribed={false} isPremium={false} onManageBilling={() => router.push('/')} />
            </div>

            <button
              className="sm:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setShowMenu(m => !m)}
              aria-label="Menu"
            >
              {showMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {showMenu && (
            <div className="sm:hidden border-t border-white/5 px-4 py-2.5 flex items-center gap-1 flex-wrap">
              <LanguageSwitcher align="left" />
              <ThemePicker align="left" />
              <AuthButton subscribed={false} isPremium={false} onManageBilling={() => router.push('/')} />
            </div>
          )}
        </div>
      </header>

      {/* ── Full-width image grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5 p-1.5">
        {tiles.map(tile => (
          <GalleryTile key={tile.rank} tile={tile} />
        ))}
      </div>

    </div>
  )
}

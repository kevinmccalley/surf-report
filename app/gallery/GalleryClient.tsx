'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import SearchBar from '@/app/components/SearchBar'
import ThemePicker from '@/app/components/ThemePicker'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import AuthButton from '@/app/components/AuthButton'
import type { GeoResult } from '@/app/lib/types'

const TOTAL_TILES = 100

function imgAlt(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function WaveLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

interface Props {
  images: string[]
}

export default function GalleryClient({ images }: Props) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on outside click
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

  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => ({
    src: i < images.length ? `/images/topSpots/${images[i]}` : null,
    alt: images[i] ? imgAlt(images[i]) : '',
  }))

  return (
    <div className="theme-bg min-h-screen">

      {/* ── Header (identical structure to main SurfApp header) ── */}
      <header className="sticky top-0 z-50 theme-header">
        <div ref={menuRef}>
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <WaveLogo />
              <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
                Groundswell
              </span>
            </a>

            <div className="flex-1 sm:max-w-xl">
              <SearchBar onSelect={handleSelect} compact />
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <LanguageSwitcher />
              <ThemePicker />
              <AuthButton subscribed={false} isPremium={false} onManageBilling={() => router.push('/')} />
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setShowMenu(m => !m)}
              aria-label="Menu"
            >
              {showMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile dropdown */}
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
        {tiles.map((tile, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden"
            style={{
              aspectRatio: '271 / 178',
              background: 'var(--panel-hover)',
            }}
          >
            {tile.src && (
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                title={tile.alt}
              />
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { SignInButton, useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SearchBar from './SearchBar'
import LanguageSwitcher from './LanguageSwitcher'
import ThemePicker from './ThemePicker'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { GeoResult } from '@/app/lib/types'

// The real site logo — blue circle, teal wave paths
function WaveLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

function UserMenu() {
  const { t } = useLanguage()
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white transition-colors">
          {t('auth.signIn')}
        </button>
      </SignInButton>
    )
  }

  const initial = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?').toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center hover:bg-sky-500/30 transition-colors"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden z-50">
          <Link
            href="/"
            className="block px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {t('nav.backToGroundswell')}
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-[var(--color-border)]"
          >
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SiteHeader() {
  const router = useRouter()
  const { t } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLElement>(null)

  const handleSelect = useCallback((result: GeoResult) => {
    router.push(`/?lat=${result.lat}&lon=${result.lon}`)
  }, [router])

  return (
    <header className="sticky top-0 z-50 theme-header" ref={menuRef}>
      <div className="px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Groundswell home"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <WaveLogo />
          <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">Groundswell</span>
        </Link>

        <div className="flex-1 sm:max-w-xl">
          <SearchBar onSelect={handleSelect} compact />
        </div>

        {/* Desktop controls */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 ml-auto">
          <a href="/spots" className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5">
            {t('nav.spots')}
          </a>
          <LanguageSwitcher />
          <ThemePicker />
          <UserMenu />
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
          <a href="/spots" onClick={() => setShowMenu(false)} className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            {t('nav.spots')}
          </a>
          <LanguageSwitcher align="left" />
          <ThemePicker align="left" />
          <UserMenu />
        </div>
      )}
    </header>
  )
}

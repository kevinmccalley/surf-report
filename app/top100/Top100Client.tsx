'use client'

import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { SPOTS, REGIONS, type Region } from './spots-data'
import SpotRow from './SpotRow'
import ThemePicker from '@/app/components/ThemePicker'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

const REGION_IDS: Record<Region, string> = {
  'Hawaii': 'region-hawaii',
  'North America': 'region-north-america',
  'Latin America': 'region-latin-america',
  'Europe': 'region-europe',
  'Africa & Atlantic': 'region-africa',
  'Indian Ocean': 'region-indian-ocean',
  'Southeast Asia': 'region-southeast-asia',
  'Oceania & Pacific': 'region-oceania',
}

const REGION_LABEL_KEYS: Record<Region, string> = {
  'Hawaii': 'top100.region.hawaii',
  'North America': 'top100.region.northAmerica',
  'Latin America': 'top100.region.latinAmerica',
  'Europe': 'top100.region.europe',
  'Africa & Atlantic': 'top100.region.africaAtlantic',
  'Indian Ocean': 'top100.region.indianOcean',
  'Southeast Asia': 'top100.region.southeastAsia',
  'Oceania & Pacific': 'top100.region.oceania',
}

export default function Top100Client() {
  const { t } = useLanguage()
  const [activeRegion, setActiveRegion] = useState<Region | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  // Shrink the sticky header once the hero content has scrolled past
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 90)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Observe region headers to update active pill in jump nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            const region = REGIONS.find(r => REGION_IDS[r] === id)
            if (region) setActiveRegion(region)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px' }
    )
    REGIONS.forEach(r => {
      const el = document.getElementById(REGION_IDS[r])
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollToRegion = (region: Region) => {
    const el = document.getElementById(REGION_IDS[region])
    if (el) {
      const offset = (navRef.current?.offsetHeight ?? 80) + 16
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const spotsByRegion = REGIONS.map(region => ({
    region,
    spots: SPOTS.filter(s => s.region === region),
  }))

  return (
    <div className="theme-bg">

      {/* ── Hero (non-sticky) — label, subtitle, hint ────────────────────── */}
      <div className="pt-16 pb-4 px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent-bright)' }}>
          Groundswell
        </p>
        <p className="theme-label text-base sm:text-lg max-w-xl mx-auto">
          {t('top100.subtitle')}
        </p>
        <p className="theme-label-muted text-xs mt-3 flex items-center justify-center gap-1.5 flex-wrap">
          <span>{t('top100.hint')}</span>
          <svg width="10" height="14" viewBox="0 0 12 16" fill="currentColor" style={{ color: 'var(--panel-muted)', flexShrink: 0 }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M6 0C2.686 0 0 2.686 0 6c0 4.5 6 10 6 10s6-5.5 6-10C12 2.686 9.314 0 6 0zm0 8.5A2.5 2.5 0 1 1 6 3.5a2.5 2.5 0 0 1 0 5z"/>
          </svg>
          <span>{t('top100.hintPin')}</span>
        </p>
      </div>

      {/* ── Sticky: shrinking title + region jump nav ────────────────────── */}
      <div ref={navRef} className="sticky top-0 z-30 theme-header transition-all duration-300">

        {/* Title — large at page top, compact once scrolled */}
        <div
          className="text-center overflow-hidden transition-all duration-300"
          style={{ paddingTop: scrolled ? '6px' : '20px', paddingBottom: scrolled ? '4px' : '12px' }}
        >
          <h1
            className="font-black leading-tight transition-all duration-300"
            style={{
              fontSize: scrolled ? '1rem' : 'clamp(1.75rem, 5vw, 3rem)',
              letterSpacing: scrolled ? '0.1em' : '0',
            }}
          >
            {t('top100.heading')}
          </h1>
        </div>

        {/* Nav second row — wraps at 670px: logo+controls on top, pills full-width below */}
        <div className="px-2 pb-2 flex flex-wrap items-center gap-y-2">

          {/* Logo — row 1 left, always order-first */}
          <div className="flex items-center gap-1.5 shrink-0 w-28 order-1">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
              <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
              <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            </svg>
            <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--accent-bright)' }}>
              Groundswell
            </span>
          </div>

          {/* Region pills — row 2 full-width on narrow, row 1 center on wide */}
          <div className="order-3 min-[670px]:order-2 w-full min-[670px]:w-auto min-[670px]:flex-1 overflow-x-auto">
            <div className="flex justify-center gap-1.5 min-w-max mx-auto px-1">
              {REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => scrollToRegion(region)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
                  style={{
                    background: activeRegion === region ? 'var(--panel-active)' : 'var(--panel-hover)',
                    color: activeRegion === region ? 'var(--accent-bright)' : 'var(--panel-label)',
                    border: activeRegion === region
                      ? '1px solid rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.35)'
                      : '1px solid transparent',
                  }}
                >
                  {t(REGION_LABEL_KEYS[region])}
                </button>
              ))}
            </div>
          </div>

          {/* Theme + language controls — row 1 right, ml-auto on narrow keeps it right-aligned */}
          <div className="order-2 min-[670px]:order-3 flex items-center gap-1 shrink-0 w-28 justify-end ml-auto min-[670px]:ml-0">
            <LanguageSwitcher align="right" />
            <ThemePicker align="right" />
          </div>
        </div>
      </div>

      {/* ── Spot list by region ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-16 mt-8">
        {spotsByRegion.map(({ region, spots }) => (
          <section key={region} id={REGION_IDS[region]}>
            {/* Region header */}
            <div className="mb-6 pt-2">
              <h2 className="text-xl font-bold">{t(REGION_LABEL_KEYS[region])}</h2>
            </div>

            {/* Spots */}
            <div className="space-y-3">
              {spots.map(spot => (
                <SpotRow key={spot.rank} spot={spot} heightUnit="ft" />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <div className="text-center pb-12 px-4">
        <p className="theme-label-muted text-xs max-w-lg mx-auto leading-relaxed">
          {t('top100.footer')}
        </p>
        <a href="/blog" className="inline-block mt-4 text-xs transition-colors"
          style={{ color: 'var(--accent)' }}>
          {t('top100.backToBlog')}
        </a>
      </div>
    </div>
  )
}

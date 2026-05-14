'use client'

import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { SPOTS, REGIONS, type Region } from './spots-data'
import SpotRow from './SpotRow'

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

  // Shrink the sticky header once the hero content has scrolled away
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 90)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Observe region headers to update active region in jump nav
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
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #0a0f1a)' }}>

      {/* ── Hero (non-sticky) — label, subtitle, hint ────────────────────── */}
      <div className="pt-16 pb-4 px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">
          Groundswell
        </p>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          {t('top100.subtitle')}
        </p>
        <p className="text-xs text-slate-600 mt-3">
          {t('top100.hint')}
        </p>
      </div>

      {/* ── Sticky: shrinking title + region jump nav ────────────────────── */}
      <div
        ref={navRef}
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(10,15,26,0.90)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Title — large at page top, compact once scrolled */}
        <div
          className="text-center overflow-hidden"
          style={{
            paddingTop: scrolled ? '6px' : '20px',
            paddingBottom: scrolled ? '4px' : '12px',
            transition: 'padding 0.3s ease',
          }}
        >
          <h1
            className="font-black text-slate-100 leading-tight"
            style={{
              fontSize: scrolled ? '0.8rem' : 'clamp(1.75rem, 5vw, 3rem)',
              letterSpacing: scrolled ? '0.08em' : '0',
              transition: 'font-size 0.3s ease, letter-spacing 0.3s ease',
            }}
          >
            {t('top100.heading')}
          </h1>
        </div>

        {/* Region pills — centered */}
        <div className="px-2 pb-2 overflow-x-auto">
          <div className="flex justify-center gap-1.5 min-w-max mx-auto">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => scrollToRegion(region)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
                style={{
                  background: activeRegion === region ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
                  color: activeRegion === region ? '#22d3ee' : '#94a3b8',
                  border: `1px solid ${activeRegion === region ? 'rgba(34,211,238,0.3)' : 'transparent'}`,
                }}
              >
                {t(REGION_LABEL_KEYS[region])}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Spot list by region ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-16 mt-8">
        {spotsByRegion.map(({ region, spots }) => (
          <section key={region} id={REGION_IDS[region]}>
            {/* Region header */}
            <div className="flex items-center gap-3 mb-6 pt-2">
              <h2 className="text-xl font-bold text-slate-200">{t(REGION_LABEL_KEYS[region])}</h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs text-slate-600 font-mono">
                #{spots[0].rank}–#{spots[spots.length - 1].rank}
              </span>
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
        <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
          {t('top100.footer')}
        </p>
        <a href="/blog" className="inline-block mt-4 text-xs text-sky-500 hover:text-sky-400 transition-colors">
          {t('top100.backToBlog')}
        </a>
      </div>
    </div>
  )
}

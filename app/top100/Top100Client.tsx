'use client'

import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { SPOTS, REGIONS, type Top100Spot, type Region } from './spots-data'
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

const REGION_EMOJI: Record<Region, string> = {
  'Hawaii': '🌺',
  'North America': '🏔',
  'Latin America': '🌊',
  'Europe': '🏄',
  'Africa & Atlantic': '🌍',
  'Indian Ocean': '🌴',
  'Southeast Asia': '🏝',
  'Oceania & Pacific': '🐋',
}

export default function Top100Client() {
  const { t } = useLanguage()
  const [activeRegion, setActiveRegion] = useState<Region | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

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
      const offset = (navRef.current?.offsetHeight ?? 60) + 16
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
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="pt-16 pb-8 px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">
          Groundswell
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-100 mb-4 leading-tight">
          {t('top100.heading')}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          {t('top100.subtitle')}
        </p>
        <p className="text-xs text-slate-600 mt-3">
          {t('top100.hint')}
        </p>
      </div>

      {/* ── Sticky region jump nav ───────────────────────────────────────── */}
      <div
        ref={navRef}
        className="sticky top-0 z-30 px-2 py-2 overflow-x-auto"
        style={{ background: 'rgba(10,15,26,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex gap-1.5 min-w-max mx-auto max-w-6xl">
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
              {REGION_EMOJI[region]} {t(REGION_LABEL_KEYS[region])}
            </button>
          ))}
        </div>
      </div>

      {/* ── Spot list by region ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-16 mt-8">
        {spotsByRegion.map(({ region, spots }) => (
          <section key={region} id={REGION_IDS[region]}>
            {/* Region header */}
            <div className="flex items-center gap-3 mb-6 pt-2">
              <span className="text-2xl">{REGION_EMOJI[region]}</span>
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

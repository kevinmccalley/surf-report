'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'
import AccuracyTrendChart from './AccuracyTrendChart'
import PaywallModal from './PaywallModal'
import type { DailyAccuracyRecord } from '@/app/api/accuracy-history/route'

// ── Shared types (imported by page.tsx too) ───────────────────────────────────

interface Match { noaaMs: number; nemoMs: number; type: 'High' | 'Low'; errorMin: number }

export interface StationResult {
  name: string
  stateAbbr: string
  matches: Match[]
  meanAbsError: number
  pctWithin30: number
  errorKey?: string
}

export interface HistAggregate {
  avgPct: number
  totalMatches: number
  avgError: number
  fmtEarliest: string
  fmtLatest: string
  days: number
  best: { name: string; stateAbbr: string; avgPct: number; samples: number } | null
  worst: { name: string; stateAbbr: string; avgPct: number; samples: number } | null
}

export interface AccuracyData {
  updatedAt: string
  results: StationResult[]
  historicalRecords: DailyAccuracyRecord[]
  displayPct: number
  liveTotalExtremes: number
  liveStationsCount: number
  hist: HistAggregate | null
  tier: 'free' | 'individual' | 'premium'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHHMM(ms: number): string {
  const d = new Date(ms)
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorDot({ min }: { min: number }) {
  const abs = Math.abs(min)
  const color = abs <= 15 ? '#2dd4bf' : abs <= 30 ? '#a3e635' : abs <= 60 ? '#fbbf24' : '#f87171'
  const sign = min > 0 ? '+' : ''
  return (
    <span style={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '3.5rem', display: 'inline-block', textAlign: 'right' }}>
      {sign}{min} min
    </span>
  )
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

// ── Page content ──────────────────────────────────────────────────────────────

export default function AccuracyPageContent({ data }: { data: AccuracyData }) {
  const { t } = useLanguage()
  const { updatedAt, results, historicalRecords, displayPct, liveTotalExtremes, liveStationsCount, hist, tier } = data
  const isFree = tier === 'free'
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <div className="theme-bg min-h-screen">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <header className="sticky top-0 z-50 theme-header">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">Groundswell</span>
          </Link>
          <span className="text-slate-700 select-none">/</span>
          <span className="text-sm text-slate-400">{t('accuracy.breadcrumb')}</span>
          <span className="ml-auto text-xs text-slate-600">{t('accuracy.updatedAt', { time: updatedAt })}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8 pb-24 space-y-5">

        {/* Headline */}
        <div className="py-2">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            <span className="text-teal-400">{displayPct}%</span>
            <span className="text-slate-300"> {t('accuracy.headlinePredictions')}</span>
            <br />
            <span className="text-slate-300">{t('accuracy.headlineWithin')}</span>
          </h1>
          <p className="text-slate-500 mt-4 text-sm max-w-lg leading-relaxed">
            {t('accuracy.subheadline1')}
            {hist ? (
              <>
                {' '}{t('accuracy.verifiedAgainst')}{' '}
                <span className="text-slate-300 font-medium">{hist.totalMatches.toLocaleString()} {t('accuracy.tideExtremes')}</span>
                {' '}{t('accuracy.overDays', { days: hist.days, from: hist.fmtEarliest, to: hist.fmtLatest })}
              </>
            ) : (
              <>
                {' '}{t('accuracy.verifiedLive')}{' '}
                <span className="text-slate-300 font-medium">{liveTotalExtremes} {t('accuracy.tideExtremes')}</span>
                {' '}{t('accuracy.acrossStations', { stations: liveStationsCount })}
              </>
            )}
          </p>
        </div>

        {/* Historical trend chart */}
        {historicalRecords.length > 0 && (
          <section className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                  {t('accuracy.trendTitle')}
                </p>
                <p className="text-xs text-slate-600">
                  {t('accuracy.trendSubtitle', { days: historicalRecords.length })}
                </p>
              </div>
              {hist && (
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold text-teal-400">{hist.avgPct}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t('accuracy.trendStat', { avgError: hist.avgError })}</p>
                </div>
              )}
            </div>
            <AccuracyTrendChart records={historicalRecords} />
            <div className="flex items-center gap-6 mt-3 text-[10px] text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: 'rgba(248,113,113,0.4)' }} />
                {t('accuracy.threshold60')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: 'rgba(45,212,191,0.3)' }} />
                {t('accuracy.target80')}
              </span>
            </div>
          </section>
        )}

        {/* Aggregate headline stats */}
        {hist && !isFree && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('accuracy.statAvgAccuracy'), value: `${hist.avgPct}%`,                       sub: t('accuracy.statWithin30'),                              color: '#2dd4bf' },
              { label: t('accuracy.statAvgError'),     value: `${hist.avgError} min`,                  sub: t('accuracy.statMeanAbsError'),                          color: '#7dd3fc' },
              { label: t('accuracy.statExtremesVerified'), value: hist.totalMatches.toLocaleString(),  sub: t('accuracy.statTotalEvents'),                           color: '#a78bfa' },
              { label: t('accuracy.statDaysTracked'),  value: String(hist.days),                       sub: t('accuracy.statSince', { date: hist.fmtEarliest }),     color: '#94a3b8' },
            ].map(stat => (
              <div key={stat.label} className="glass-card rounded-xl p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Best / worst station callouts */}
        {hist && hist.best && hist.worst && hist.best.name !== hist.worst.name && !isFree && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4" style={{ borderColor: 'rgba(45,212,191,0.2)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-500 mb-1">{t('accuracy.mostAccurate')}</p>
              <p className="text-base font-semibold text-white">{hist.best.name}, {hist.best.stateAbbr}</p>
              <p className="text-2xl font-bold text-teal-400 mt-0.5">{hist.best.avgPct}%</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{t('accuracy.avgOverChecks', { n: hist.best.samples })}</p>
            </div>
            <div className="glass-card rounded-xl p-4" style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1">{t('accuracy.needsAttention')}</p>
              <p className="text-base font-semibold text-white">{hist.worst.name}, {hist.worst.stateAbbr}</p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{hist.worst.avgPct}%</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{t('accuracy.avgOverChecks', { n: hist.worst.samples })}</p>
            </div>
          </div>
        )}

        {/* Upgrade teaser for free tier */}
        {isFree && (
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-teal-500/20 bg-teal-500/6 hover:bg-teal-500/10 transition-colors text-left group"
          >
            <div>
              <p className="text-sm font-semibold text-teal-300">{t('accuracy.fullHistoryGateTitle')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('accuracy.fullHistoryGateDesc')}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-teal-400/60 group-hover:text-teal-300 transition-colors">
              <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 border-t border-white/5" />
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">{t('accuracy.liveCheck', { time: updatedAt })}</span>
          <div className="flex-1 border-t border-white/5" />
        </div>

        {/* Station cards */}
        {!isFree && results.map(station => (
          <section key={station.name} className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-0.5">
                  {t('accuracy.noaaStation')}
                </p>
                <h2 className="text-white font-semibold">{station.name}, {station.stateAbbr}</h2>
              </div>
              {station.errorKey ? (
                <span className="shrink-0 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                  {t('accuracy.unavailable')}
                </span>
              ) : (
                <div className="text-right shrink-0">
                  <span className="text-3xl font-bold text-teal-400">{station.pctWithin30}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t('accuracy.within30Avg', { n: station.meanAbsError })}</p>
                </div>
              )}
            </div>

            {station.errorKey ? (
              <p className="text-sm text-slate-600 italic">{t(station.errorKey)}</p>
            ) : (
              <div className="space-y-1">
                <div className="grid gap-2 px-3 pb-1" style={{ gridTemplateColumns: '3rem 1fr 1fr auto' }}>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">{t('accuracy.colType')}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">{t('accuracy.colNoaa')}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700">{t('accuracy.colGroundswell')}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700 text-right">{t('accuracy.colError')}</span>
                </div>
                {station.matches.slice(0, 9).map((m, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      gridTemplateColumns: '3rem 1fr 1fr auto',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.045)',
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: m.type === 'High' ? '#2dd4bf' : '#94a3b8' }}>
                      {m.type === 'High' ? t('accuracy.tideHigh') : t('accuracy.tideLow')}
                    </span>
                    <span className="text-xs text-slate-300 tabular-nums">{fmtHHMM(m.noaaMs)}</span>
                    <span className="text-xs text-slate-300 tabular-nums">{fmtHHMM(m.nemoMs)}</span>
                    <ErrorDot min={m.errorMin} />
                  </div>
                ))}
                {station.matches.length > 9 && (
                  <p className="text-xs text-slate-700 px-3 pt-1">
                    {t('accuracy.moreExtremes', { n: station.matches.length - 9 })}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 text-xs text-slate-600">
          <span><span className="font-semibold text-teal-400">≤ 15 min</span> — {t('accuracy.legendExcellent')}</span>
          <span><span className="font-semibold" style={{ color: '#a3e635' }}>16–30 min</span> — {t('accuracy.legendGood')}</span>
          <span><span className="font-semibold text-amber-400">31–60 min</span> — {t('accuracy.legendAcceptable')}</span>
          <span><span className="font-semibold text-red-400">&gt; 60 min</span> — {t('accuracy.legendInvestigate')}</span>
          <span className="ml-auto">{t('accuracy.allTimesUtc')}</span>
        </div>

        {/* Methodology */}
        <section className="glass-card rounded-2xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            {t('accuracy.methodTitle')}
          </h2>
          <div className="space-y-3.5 text-sm text-slate-500 leading-relaxed">
            <p><span className="text-slate-200 font-medium">{t('accuracy.methodRefLabel')}</span>{' '}{t('accuracy.methodRefText')}</p>
            <p><span className="text-slate-200 font-medium">{t('accuracy.methodModelLabel')}</span>{' '}{t('accuracy.methodModelText')}</p>
            <p><span className="text-slate-200 font-medium">{t('accuracy.methodMatchLabel')}</span>{' '}{t('accuracy.methodMatchText')}</p>
            <p><span className="text-slate-200 font-medium">{t('accuracy.methodDailyLabel')}</span>{' '}{t('accuracy.methodDailyText')}</p>
          </div>
        </section>

        {/* Data Sources */}
        <DataSourcesSection t={t} />

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7dd3fc' }}
          >
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            {t('accuracy.ctaButton')}
          </Link>
        </div>

      </main>
    </div>
  )
}

// ── Data Sources table ────────────────────────────────────────────────────────

interface DataSource {
  name: string
  url: string
  use: string
  coverage: string
  license: string
  tag: 'waves' | 'weather' | 'tides' | 'buoy' | 'geo' | 'map'
}

const DATA_SOURCES: DataSource[] = [
  {
    name: 'Open-Meteo Marine API',
    url: 'https://open-meteo.com/en/docs/marine-weather-api',
    use: 'Wave height, swell direction & period, sea surface temperature',
    coverage: 'Global oceans',
    license: 'Free · CC BY 4.0',
    tag: 'waves',
  },
  {
    name: 'Open-Meteo Forecast API',
    url: 'https://open-meteo.com/en/docs',
    use: 'Wind speed & direction, air temperature, UV index, precipitation probability, weather codes',
    coverage: 'Global',
    license: 'Free · CC BY 4.0',
    tag: 'weather',
  },
  {
    name: 'Open-Meteo Archive API',
    url: 'https://open-meteo.com/en/docs/historical-weather-api',
    use: 'Historical surf conditions (back to Jan 2022) and 3-year surf climatology averages',
    coverage: 'Global',
    license: 'Free · CC BY 4.0',
    tag: 'waves',
  },
  {
    name: 'NOAA CO-OPS',
    url: 'https://tidesandcurrents.noaa.gov/',
    use: 'Harmonic tide predictions for US coastal stations; ground-truth reference for our accuracy verification',
    coverage: 'United States',
    license: 'Free · public domain',
    tag: 'tides',
  },
  {
    name: 'Fisheries & Oceans Canada (DFO)',
    url: 'https://www.tides.gc.ca/',
    use: 'Harmonic tide predictions for Canadian coastal stations',
    coverage: 'Canada',
    license: 'Free · open govt licence',
    tag: 'tides',
  },
  {
    name: 'Open-Meteo Global Tidal Model',
    url: 'https://open-meteo.com/en/docs/tide-api',
    use: 'Tide predictions for all locations outside NOAA / DFO coverage — the rest of the world',
    coverage: 'Global (fallback)',
    license: 'Free · CC BY 4.0',
    tag: 'tides',
  },
  {
    name: 'NOAA NDBC',
    url: 'https://www.ndbc.noaa.gov/',
    use: 'Live ocean buoy readings — wave height, dominant period, swell direction, water temperature, wind',
    coverage: 'Global (US-operated)',
    license: 'Free · public domain',
    tag: 'buoy',
  },
  {
    name: 'OpenStreetMap Nominatim',
    url: 'https://nominatim.openstreetmap.org/',
    use: 'Location search and geocoding — converts place names to coordinates',
    coverage: 'Global',
    license: 'Free · ODbL',
    tag: 'geo',
  },
  {
    name: 'Surfline',
    url: 'https://www.surfline.com/',
    use: 'Nearby surf spot names and coordinates — bundled at build time from Surfline\'s public web endpoint; all forecast data is sourced independently from Open-Meteo',
    coverage: 'Global',
    license: 'Public web data',
    tag: 'geo',
  },
  {
    name: 'OpenStreetMap Overpass API',
    url: 'https://overpass-api.de/',
    use: 'Supplementary nearby spot discovery — fallback for regions not covered by Surfline',
    coverage: 'Global',
    license: 'Free · ODbL',
    tag: 'geo',
  },
  {
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    use: 'Supplementary surf break data (Q693906 surfing break · Q2368508 surf spot) for sparse coverage areas',
    coverage: 'Global',
    license: 'Free · CC0',
    tag: 'geo',
  },
  {
    name: 'CartoDB Basemaps',
    url: 'https://carto.com/basemaps/',
    use: 'Interactive map tile backgrounds (light and dark themes)',
    coverage: 'Global',
    license: 'Free · attribution required',
    tag: 'map',
  },
  {
    name: 'Natural Earth 110m',
    url: 'https://www.naturalearthdata.com/',
    use: 'Land polygon masking — ensures animated swell arcs stop at coastlines on the live map',
    coverage: 'Global',
    license: 'Free · public domain',
    tag: 'map',
  },
]

const TAG_STYLES: Record<DataSource['tag'], { bg: string; text: string; labelKey: string }> = {
  waves:   { bg: 'rgba(14,165,233,0.14)',  text: '#38bdf8', labelKey: 'accuracy.sourceTag.waves'   },
  weather: { bg: 'rgba(234,179,8,0.14)',   text: '#fbbf24', labelKey: 'accuracy.sourceTag.weather' },
  tides:   { bg: 'rgba(45,212,191,0.14)',  text: '#2dd4bf', labelKey: 'accuracy.sourceTag.tides'   },
  buoy:    { bg: 'rgba(168,85,247,0.14)',  text: '#c084fc', labelKey: 'accuracy.sourceTag.buoy'    },
  geo:     { bg: 'rgba(132,204,22,0.14)',  text: '#a3e635', labelKey: 'accuracy.sourceTag.geo'     },
  map:     { bg: 'rgba(148,163,184,0.14)', text: '#94a3b8', labelKey: 'accuracy.sourceTag.map'     },
}

function Tag({ tag, t }: { tag: DataSource['tag']; t: (k: string) => string }) {
  const s = TAG_STYLES[tag]
  return (
    <span
      className="inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none shrink-0"
      style={{ background: s.bg, color: s.text }}
    >
      {t(s.labelKey)}
    </span>
  )
}

function DataSourcesSection({ t }: { t: (k: string) => string }) {
  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
        {t('accuracy.sourcesTitle')}
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-2xl">
        {t('accuracy.sourcesIntro')}
      </p>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-2">
        {DATA_SOURCES.map(src => (
          <div
            key={src.name}
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Tag tag={src.tag} t={t} />
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                {src.name} ↗
              </a>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-1.5">{src.use}</p>
            <div className="flex gap-3 text-[11px] text-slate-600">
              <span>{src.coverage}</span>
              <span>·</span>
              <span>{src.license}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {(
                ['accuracy.sourcesColSource', 'accuracy.sourcesColUse', 'accuracy.sourcesColCoverage', 'accuracy.sourcesColLicense'] as const
              ).map(k => (
                <th
                  key={k}
                  className="text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 pb-3 pr-5 last:pr-0"
                >
                  {t(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA_SOURCES.map((src, i) => (
              <tr
                key={src.name}
                style={{
                  borderTop: i === 0 ? undefined : '1px solid rgba(255,255,255,0.045)',
                }}
              >
                <td className="py-3 pr-5 align-top">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag tag={src.tag} t={t} />
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 transition-colors font-medium whitespace-nowrap"
                    >
                      {src.name} ↗
                    </a>
                  </div>
                </td>
                <td className="py-3 pr-5 align-top text-slate-400 leading-relaxed" style={{ maxWidth: '22rem' }}>
                  {src.use}
                </td>
                <td className="py-3 pr-5 align-top text-slate-500 whitespace-nowrap">
                  {src.coverage}
                </td>
                <td className="py-3 align-top text-slate-600 whitespace-nowrap">
                  {src.license}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-700 mt-5 pt-4 border-t border-white/5 leading-relaxed">
        {t('accuracy.sourcesFooter')}
      </p>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-slate-600">
        <a href="/terms"   className="hover:text-slate-400 transition-colors">{t('nav.terms')}</a>
        <a href="/privacy" className="hover:text-slate-400 transition-colors">{t('nav.privacy')}</a>
        <a href="/refund"  className="hover:text-slate-400 transition-colors">{t('nav.refund')}</a>
        <a href="/support" className="hover:text-slate-400 transition-colors">{t('nav.support')}</a>
      </nav>
    </section>
  )
}

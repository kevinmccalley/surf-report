'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'
import AccuracyTrendChart from './AccuracyTrendChart'
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
  const { updatedAt, results, historicalRecords, displayPct, liveTotalExtremes, liveStationsCount, hist } = data

  return (
    <div className="theme-bg min-h-screen">
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
          <p className="text-sm font-medium text-slate-400 mb-4">
            {t('accuracy.surflineNote')}
          </p>
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
        {hist && (
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
        {hist && hist.best && hist.worst && hist.best.name !== hist.worst.name && (
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

        {/* Divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 border-t border-white/5" />
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">{t('accuracy.liveCheck', { time: updatedAt })}</span>
          <div className="flex-1 border-t border-white/5" />
        </div>

        {/* Station cards */}
        {results.map(station => (
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

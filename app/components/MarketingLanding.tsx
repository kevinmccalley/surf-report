'use client'

import { useState } from 'react'
import { SignInButton, useClerk } from '@clerk/nextjs'
import SearchBar from './SearchBar'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { usePriceDisplay } from '@/app/hooks/usePriceDisplay'
import type { GeoResult } from '@/app/lib/types'

// ── Mock data (illustrative only — not user-facing text) ─────────────────────

const MOCK_DAYS = [
  { label: 'Thu', rating: 'GOOD',  height: '3–4 ft', wind: '8 kts' },
  { label: 'Fri', rating: 'EPIC',  height: '5–7 ft', wind: '6 kts' },
  { label: 'Sat', rating: 'GREAT', height: '4–5 ft', wind: '10 kts' },
  { label: 'Sun', rating: 'FAIR',  height: '2–3 ft', wind: '14 kts' },
  { label: 'Mon', rating: 'GOOD',  height: '3–4 ft', wind: '9 kts' },
  { label: 'Tue', rating: 'EPIC',  height: '6–8 ft', wind: '5 kts' },
  { label: 'Wed', rating: 'GREAT', height: '4–6 ft', wind: '7 kts' },
  { label: 'Thu', rating: 'GOOD',  height: '3–4 ft', wind: '11 kts' },
  { label: 'Fri', rating: 'FAIR',  height: '2–3 ft', wind: '15 kts' },
  { label: 'Sat', rating: 'GOOD',  height: '3–5 ft', wind: '8 kts' },
]

const RATING_COLORS: Record<string, string> = {
  EPIC:  'text-violet-300 bg-violet-500/15 border-violet-500/30',
  GREAT: 'text-teal-300  bg-teal-500/15  border-teal-500/30',
  GOOD:  'text-sky-300   bg-sky-500/15   border-sky-500/30',
  FAIR:  'text-slate-300 bg-white/5      border-white/10',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingLanding({ onSearch }: { onSearch: (r: GeoResult) => void }) {
  const { openSignIn } = useClerk()
  const { t } = useLanguage()
  const { format } = usePriceDisplay()
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')

  const STEPS = [
    { icon: SearchIcon,   title: t('mktL.step1.title'), desc: t('mktL.step1.desc') },
    { icon: WaveIcon,     title: t('mktL.step2.title'), desc: t('mktL.step2.desc') },
    { icon: CalendarIcon, title: t('mktL.step3.title'), desc: t('mktL.step3.desc') },
  ]

  const TRUST_ITEMS = [
    { stat: t('mktL.trust.1stat'), label: t('mktL.trust.1label') },
    { stat: t('mktL.trust.2stat'), label: t('mktL.trust.2label') },
    { stat: t('mktL.trust.3stat'), label: t('mktL.trust.3label') },
    { stat: t('mktL.trust.4stat'), label: t('mktL.trust.4label') },
    { stat: t('mktL.trust.5stat'), label: t('mktL.trust.5label') },
  ]

  const PAIN_COLUMNS = [
    { heading: t('mktL.pain.1.heading'), body: t('mktL.pain.1.body'), answer: t('mktL.pain.1.answer') },
    { heading: t('mktL.pain.2.heading'), body: t('mktL.pain.2.body'), answer: t('mktL.pain.2.answer') },
    { heading: t('mktL.pain.3.heading'), body: t('mktL.pain.3.body'), answer: t('mktL.pain.3.answer') },
  ]

  const FREE_FEATURES = [
    t('mktL.free.f1'), t('mktL.free.f2'), t('mktL.free.f3'),
    t('mktL.free.f4'), t('mktL.free.f5'), t('mktL.free.f6'),
  ]

  const IND_FEATURES = [
    t('mktL.ind.f1'), t('mktL.ind.f2'), t('mktL.ind.f3'), t('mktL.ind.f4'),
    t('mktL.ind.f5'), t('mktL.ind.f6'), t('mktL.ind.f7'), t('mktL.ind.f8'),
  ]

  const PREMIUM_FEATURES = [
    t('mktL.prem.f1'), t('mktL.prem.f2'), t('mktL.prem.f3'), t('mktL.prem.f4'),
  ]

  function handleSearch(result: GeoResult) {
    const url = `/?lat=${result.lat}&lon=${result.lon}&name=${encodeURIComponent(result.name)}&country=${encodeURIComponent(result.country)}`
    sessionStorage.setItem('postSignInUrl', url)
    openSignIn()
  }

  return (
    <div className="w-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-57px)] flex flex-col items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-96 bg-sky-500/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
        </div>
        <WaveBackground />

        <div className="relative z-10 text-center w-full max-w-2xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            {t('mktL.badge')}
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4 leading-[1.05]">
            <span className="text-white">{t('mktL.h1.pre')}</span>
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">{t('mktL.h1.gradient')}</span>
            <span className="text-white">{t('mktL.h1.post')}</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl mb-8 max-w-lg mx-auto leading-relaxed">
            {t('mktL.subtitle')}
          </p>

          <div className="w-full max-w-lg mx-auto mb-6">
            <SearchBar onSelect={handleSearch} loading={false} autoFocus />
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-sky-500/20">
                {t('mktL.ctaFree')}
              </button>
            </SignInButton>
            <a href="#how-it-works" className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 font-medium text-sm transition-colors">
              {t('mktL.ctaPricing')}
            </a>
          </div>

          <p className="text-xs text-slate-600">{t('mktL.heroTrust')}</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-4">
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-white mb-0.5">{item.stat}</span>
                <span className="text-xs text-slate-500 leading-snug">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">{t('mktL.howTitle')}</h2>
          <p className="text-slate-500 text-center mb-12">{t('mktL.howSubtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-white/8 bg-white/3">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
                  <step.icon />
                </div>
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why surfers switch ───────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">{t('mktL.pain.title')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PAIN_COLUMNS.map((col, i) => (
              <div key={i} className="flex flex-col p-6 rounded-2xl border border-white/8 bg-white/3">
                <h3 className="text-white font-semibold text-base mb-3 leading-snug">{col.heading}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">{col.body}</p>
                <div className="pt-4 border-t border-teal-500/20">
                  <p className="text-teal-400 text-sm font-medium leading-snug">{col.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature: Historical data (hero feature) ──────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/4 p-8 sm:p-10">
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-3">{t('mktL.feat1.label')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">{t('mktL.feat1.heading')}</h2>
            <p className="text-slate-400 leading-relaxed max-w-2xl">{t('mktL.feat1.body')}</p>
          </div>
        </div>
      </section>

      {/* ── Features 2–5 ────────────────────────────────────────────────── */}
      <section className="py-4 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Best surf now */}
          <div className="p-7 rounded-2xl border border-white/8 bg-white/3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{t('mktL.feat2.label')}</p>
            <h3 className="text-lg font-bold text-white mb-3 leading-snug">{t('mktL.feat2.heading')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('mktL.feat2.body')}</p>
          </div>

          {/* Accuracy */}
          <div className="p-7 rounded-2xl border border-white/8 bg-white/3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{t('mktL.feat3.label')}</p>
            <h3 className="text-lg font-bold text-white mb-3 leading-snug">{t('mktL.feat3.heading')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">{t('mktL.feat3.body')}</p>
            <a href="/accuracy" className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium">
              {t('mktL.feat3.cta')}
            </a>
          </div>

          {/* Tides */}
          <div className="p-7 rounded-2xl border border-white/8 bg-white/3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{t('mktL.feat4.label')}</p>
            <h3 className="text-lg font-bold text-white mb-3 leading-snug">{t('mktL.feat4.heading')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('mktL.feat4.body')}</p>
          </div>

          {/* No ads */}
          <div className="p-7 rounded-2xl border border-white/8 bg-white/3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{t('mktL.feat5.label')}</p>
            <h3 className="text-lg font-bold text-white mb-3 leading-snug">{t('mktL.feat5.heading')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('mktL.feat5.body')}</p>
          </div>

        </div>
      </section>

      {/* ── Forecast teaser ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-white/5 mt-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">{t('mktL.teaserTitle')}</h2>
          <p className="text-slate-500 text-center mb-10">{t('mktL.teaserSubtitle')}</p>

          <div className="relative rounded-2xl border border-white/8 glass-card overflow-hidden p-4">
            <div className="grid grid-cols-10 gap-1.5">
              {MOCK_DAYS.map((day, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center ${RATING_COLORS[day.rating]} ${i >= 3 ? 'opacity-40' : ''}`}
                >
                  <span className="text-[10px] text-slate-500 font-medium">{day.label}</span>
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${RATING_COLORS[day.rating]}`}>{day.rating}</span>
                  <span className="text-[10px] text-slate-300 font-medium">{day.height}</span>
                  <span className="text-[10px] text-slate-500">{day.wind}</span>
                </div>
              ))}
            </div>

            <div className="absolute inset-y-0 right-0 w-[72%] flex items-center justify-center"
              style={{ background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--bg-mid) 85%, transparent) 20%, color-mix(in srgb, var(--bg-mid) 97%, transparent) 50%)' }}>
              <div className="text-center px-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/25 mb-3">
                  <LockIcon />
                </div>
                <p className="text-white font-semibold text-sm mb-1">{t('mktL.teaserLock')}</p>
                <p className="text-slate-500 text-xs mb-4">{t('mktL.teaserPrice')}</p>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors">
                    {t('mktL.teaserCta')}
                  </button>
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature comparison ───────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">{t('mktL.featTitle')}</h2>
          <p className="text-slate-500 text-center mb-10">{t('mktL.featSubtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{t('mktL.free.tier')}</p>
              <p className="text-3xl font-bold text-white mb-1">{format(0)}</p>
              <p className="text-xs text-slate-600 mb-4">{t('mktL.free.note')}</p>
              <ul className="space-y-2.5 flex-1">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckIcon className="text-slate-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <SignInButton mode="modal">
                <button className="mt-6 w-full py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium transition-colors">
                  {t('mktL.free.cta')}
                </button>
              </SignInButton>
            </div>

            {/* Individual — highlighted */}
            <div className="flex flex-col rounded-2xl border border-teal-500/40 bg-teal-500/6 p-5 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500 text-white whitespace-nowrap">
                {t('mktL.ind.badge')}
              </span>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">{t('mktL.ind.tier')}</p>
              <div className="mb-1">
                <span className="text-3xl font-bold text-white">
                  {billing === 'annual' ? format(3.33) : format(4)}
                </span>
                <span className="text-sm text-slate-500 ml-1">/mo</span>
                {billing === 'annual' && <p className="text-xs text-teal-400/80 mt-0.5">{t('mktL.ind.billed')}</p>}
              </div>
              <p className="text-xs text-slate-600 mb-4">{t('mktL.ind.noCard')}</p>
              <ul className="space-y-2.5 flex-1">
                {IND_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckIcon className="text-teal-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <SignInButton mode="modal">
                <button className="mt-6 w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors">
                  {t('mktL.ind.cta')}
                </button>
              </SignInButton>
            </div>

            {/* Premium — coming soon */}
            <div className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5 opacity-60">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('mktL.prem.tier')}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/20 text-sky-400 font-medium">{t('mktL.prem.badge')}</span>
              </div>
              <p className="text-3xl font-bold text-slate-300 mb-4">{format(12)}<span className="text-base font-normal text-slate-500 ml-1">/mo</span></p>
              <ul className="space-y-2.5 flex-1">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                    <LockSmallIcon className="mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="mt-6 w-full py-2.5 rounded-xl border border-white/8 text-slate-600 text-sm font-medium cursor-not-allowed">
                {t('mktL.prem.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing section ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('mktL.pricingTitle')}</h2>
          <p className="text-slate-500 mb-8">{t('mktL.pricingSubtitle')}</p>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-8">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t('mktL.toggleMonthly')}
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t('mktL.toggleAnnual')}
              <span className="ml-1.5 text-[10px] text-teal-400 font-semibold">–17%</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-teal-500/30 p-6 text-left mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest">{t('mktL.planName')}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold text-white">{billing === 'annual' ? format(3.33) : format(4)}</span>
                  <span className="text-slate-500 text-sm">{t('mktL.perMonth')}</span>
                </div>
                {billing === 'annual' && <p className="text-xs text-teal-400/80 mt-0.5">{t('mktL.billedAnnual')}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{t('mktL.trial')}</p>
                <p className="text-xs text-slate-500">{t('mktL.cancelAnytime')}</p>
              </div>
            </div>
            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors">
                {t('mktL.startTrial')}
              </button>
            </SignInButton>
            <p className="text-center text-xs text-slate-600 mt-2">{t('mktL.noCard')}</p>
          </div>

          <p className="text-xs text-slate-600">
            {t('mktL.haveAccount')}{' '}
            <SignInButton mode="modal">
              <button className="text-sky-500 hover:text-sky-400 transition-colors">{t('mktL.signIn')}</button>
            </SignInButton>
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
            {t('mktL.finalCta.heading')}
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {t('mktL.finalCta.body')}
          </p>
          <SignInButton mode="modal">
            <button className="px-7 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-sky-500/20 mb-4">
              {t('mktL.ctaFree')}
            </button>
          </SignInButton>
          <p className="text-xs text-slate-600 mt-3">{t('mktL.finalTrust')}</p>
        </div>
      </section>

      {/* ── Footer nudge ─────────────────────────────────────────────────── */}
      <div className="py-10 text-center border-t border-white/5">
        <p className="text-slate-600 text-xs">
          {t('mktL.footer')}
        </p>
      </div>

    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 12 C5 8, 8 16, 12 12 C16 8, 19 16, 22 12"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function LockSmallIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2.5" y="6.5" width="9" height="6" rx="1" stroke="#475569" strokeWidth="1.2"/>
      <path d="M4.5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function WaveBackground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="w-full absolute bottom-0" preserveAspectRatio="none">
        <path d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1440,20 1440,60 L1440,120 L0,120 Z" fill="rgba(14,165,233,0.04)" />
      </svg>
      <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="w-full absolute bottom-0" preserveAspectRatio="none">
        <path d="M0,40 C200,80 400,10 600,50 C800,90 1000,10 1200,50 C1300,70 1380,30 1440,50 L1440,120 L0,120 Z" fill="rgba(56,189,248,0.05)" />
      </svg>
    </div>
  )
}

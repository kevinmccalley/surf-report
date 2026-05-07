'use client'

import { useState } from 'react'
import { SignInButton, useClerk } from '@clerk/nextjs'
import SearchBar from './SearchBar'
import type { GeoResult } from '@/app/lib/types'

// ── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: SearchIcon,
    title: 'Search any spot',
    desc: 'Type any beach, point break, or reef anywhere on Earth. Powered by OpenStreetMap.',
  },
  {
    icon: WaveIcon,
    title: 'See real-time conditions',
    desc: 'Wave height, swell period & direction, wind, tides, and UV — updated every hour.',
  },
  {
    icon: CalendarIcon,
    title: 'Plan your session',
    desc: 'Full 10-day forecast with surf ratings. Know the best window days in advance.',
  },
]

const FREE_FEATURES    = ['Any surf spot worldwide', '3-day forecast', 'Current conditions & wind', 'Basic tide info', 'Save 1 favourite spot']
const IND_FEATURES     = ['Full 10-day forecast', '5-day tide curve + NOAA verification', '400+ days of accuracy history', 'Historical conditions since 2022', 'Best surf now — 608 live spots', 'Save up to 20 spots']
const PREMIUM_FEATURES = ['16-day extended forecast', 'Multi-model comparison (GFS vs NEMO)', 'Swell alert notifications', 'API access for developers']

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
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')

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
            Real-time surf reports — worldwide
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4 leading-[1.05]">
            <span className="text-white">Know </span>
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">before</span>
            <span className="text-white"> you go.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl mb-8 max-w-lg mx-auto leading-relaxed">
            Wave height, swell, wind, tides, and 10-day forecasts for any surf spot on Earth.
          </p>

          <div className="w-full max-w-lg mx-auto mb-6">
            <SearchBar onSelect={handleSearch} loading={false} autoFocus />
          </div>

          <div className="flex items-center justify-center gap-3">
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors">
                Start free — no card needed
              </button>
            </SignInButton>
            <a href="#pricing" className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 font-medium text-sm transition-colors">
              See pricing
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">How it works</h2>
          <p className="text-slate-500 text-center mb-12">From search to session in seconds.</p>

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

      {/* ── Forecast teaser ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">10-day surf forecast</h2>
          <p className="text-slate-500 text-center mb-10">See exactly when the swell peaks — days in advance.</p>

          <div className="relative rounded-2xl border border-white/8 bg-white/3 overflow-hidden p-4">
            {/* Mock forecast grid */}
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

            {/* Blur overlay for days 4–10 */}
            <div className="absolute inset-y-0 right-0 w-[72%] flex items-center justify-center"
              style={{ background: 'linear-gradient(to right, transparent, rgba(6,18,36,0.85) 20%, rgba(6,18,36,0.97) 50%)' }}>
              <div className="text-center px-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/25 mb-3">
                  <LockIcon />
                </div>
                <p className="text-white font-semibold text-sm mb-1">Unlock the full 10-day forecast</p>
                <p className="text-slate-500 text-xs mb-4">Individual plan — from $3.33/mo</p>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors">
                    Start free trial
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">Everything you need</h2>
          <p className="text-slate-500 text-center mb-10">Start free. Upgrade when you're ready.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Free</p>
              <p className="text-3xl font-bold text-white mb-4">$0</p>
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
                  Get started free
                </button>
              </SignInButton>
            </div>

            {/* Individual — highlighted */}
            <div className="flex flex-col rounded-2xl border border-teal-500/40 bg-teal-500/6 p-5 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500 text-white whitespace-nowrap">
                Most popular
              </span>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">Individual</p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {billing === 'annual' ? '$3.33' : '$4'}
                </span>
                <span className="text-sm text-slate-500 ml-1">/mo</span>
                {billing === 'annual' && <p className="text-xs text-teal-400/80 mt-0.5">billed $40/year · save 17%</p>}
              </div>
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
                  Start 7-day free trial
                </button>
              </SignInButton>
            </div>

            {/* Premium — coming soon */}
            <div className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5 opacity-60">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Premium</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/20 text-sky-400 font-medium">Coming soon</span>
              </div>
              <p className="text-3xl font-bold text-slate-300 mb-4">$12<span className="text-base font-normal text-slate-500 ml-1">/mo</span></p>
              <ul className="space-y-2.5 flex-1">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                    <LockSmallIcon className="mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="mt-6 w-full py-2.5 rounded-xl border border-white/8 text-slate-600 text-sm font-medium cursor-not-allowed">
                Notify me
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing section ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Simple pricing</h2>
          <p className="text-slate-500 mb-8">No hidden fees. Cancel anytime.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-8">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Monthly · $4
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Annual · $40
              <span className="ml-1.5 text-[10px] text-teal-400 font-semibold">–17%</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-teal-500/30 p-6 text-left mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest">Individual</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold text-white">{billing === 'annual' ? '$3.33' : '$4'}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                {billing === 'annual' && <p className="text-xs text-teal-400/80 mt-0.5">Billed as $40/year</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">7-day free trial</p>
                <p className="text-xs text-slate-500">Cancel anytime</p>
              </div>
            </div>
            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors">
                Start free trial
              </button>
            </SignInButton>
            <p className="text-center text-xs text-slate-600 mt-2">No credit card required to start</p>
          </div>

          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <SignInButton mode="modal">
              <button className="text-sky-500 hover:text-sky-400 transition-colors">Sign in</button>
            </SignInButton>
          </p>
        </div>
      </section>

      {/* ── Footer nudge ─────────────────────────────────────────────────── */}
      <div className="py-10 text-center border-t border-white/5">
        <p className="text-slate-600 text-xs">
          Open ocean data from NOAA, ECMWF, and Copernicus Marine. Updated hourly.
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

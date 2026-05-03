'use client'

import { useState, useEffect, useRef } from 'react'
import { SignInButton, useUser } from '@clerk/nextjs'

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!
const ANNUAL_PRICE_ID  = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!

export default function MarketingPage() {
  const { isSignedIn } = useUser()
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null)
  const [activating, setActivating] = useState(false)

  // Auto-trigger checkout after sign-in. Google OAuth doesn't reliably preserve
  // ?checkout=1 through its redirect chain, so we also set a localStorage flag
  // before opening the modal and check it here as a fallback.
  useEffect(() => {
    if (!isSignedIn) return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('checkout') === '1'
    const fromStorage = localStorage.getItem('pendingCheckout') === 'annual'
    if (fromUrl || fromStorage) {
      window.history.replaceState({}, '', '/')
      localStorage.removeItem('pendingCheckout')
      startCheckout('annual')
    }
  }, [isSignedIn])

  // Show "activating" screen if redirected back from Stripe success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      setActivating(true)
      window.history.replaceState({}, '', '/')
      // Reload after 3s to pick up webhook-updated subscription status
      setTimeout(() => window.location.reload(), 3000)
    }
  }, [])

  async function startCheckout(plan: 'monthly' | 'annual') {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan === 'annual' ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (activating) return <ActivatingScreen />

  return (
    <div className="theme-bg min-h-screen">

      {/* ── Minimal nav ── */}
      <nav className="sticky top-0 z-50 theme-header">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WaveLogo />
            <span className="text-sm font-bold tracking-wide text-white">Groundswell</span>
          </div>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <button
                onClick={() => startCheckout('annual')}
                disabled={!!checkoutLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? 'Loading…' : 'Start free trial'}
              </button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/?checkout=1">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Animated wave background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="wave-container" style={{ bottom: 0, height: '280px' }}>
            <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="wave-path-1 w-full h-full" style={{ opacity: 0.06 }}>
              <path d="M0,140 C180,200 360,80 540,140 C720,200 900,80 1080,140 C1260,200 1350,100 1440,140 L1440,280 L0,280 Z" fill="currentColor" className="text-sky-400" />
            </svg>
          </div>
          <div className="wave-container" style={{ bottom: 0, height: '220px' }}>
            <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="wave-path-2 w-full h-full" style={{ opacity: 0.04 }}>
              <path d="M0,110 C200,160 400,60 600,110 C800,160 1000,60 1200,110 C1300,140 1380,80 1440,110 L1440,220 L0,220 Z" fill="currentColor" className="text-teal-400" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 text-sky-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Live data · Fresh on every search
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            Know Before<br />
            <span className="bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">
              You Go.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto leading-relaxed mb-10">
            Real-time surf reports and 10-day forecasts for every break on earth.
            From Pipeline to your local beach — wave height, swell, wind, tides, and more.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isSignedIn ? (
              <>
                <button
                  onClick={() => startCheckout('annual')}
                  disabled={!!checkoutLoading}
                  className="trial-cta-btn w-full sm:w-auto px-8 py-4 rounded-2xl active:scale-95 text-white font-bold text-base transition-all disabled:opacity-60"
                >
                  {checkoutLoading === 'annual' ? 'Loading…' : 'Start 7-day free trial'}
                </button>
                <button
                  onClick={() => startCheckout('monthly')}
                  disabled={!!checkoutLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 text-slate-300 font-semibold text-base transition-all disabled:opacity-60"
                >
                  {checkoutLoading === 'monthly' ? 'Loading…' : 'Monthly · $4/mo'}
                </button>
              </>
            ) : (
              <>
                <div onClick={() => localStorage.setItem('pendingCheckout', 'annual')}>
                  <SignInButton mode="modal" forceRedirectUrl="/?checkout=1">
                    <button className="trial-cta-btn w-full sm:w-auto px-8 py-4 rounded-2xl active:scale-95 text-white font-bold text-base transition-all">
                      Start 7-day free trial →
                    </button>
                  </SignInButton>
                </div>
                <p className="text-sm text-slate-400">No credit card required to try</p>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4">
            $40/year or $4/month after trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white mb-3">
            Everything you need to read the ocean
          </h2>
          <p className="text-center text-slate-300 mb-14 max-w-md mx-auto">
            One search. Every condition that matters. Updated hourly from the best free data sources on the planet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card rounded-2xl p-6">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App preview ── */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-slate-400 font-mono">Pipeline, North Shore, Hawaii</span>
            </div>

            {/* Simulated report preview */}
            <div className="space-y-4">
              {/* Rating badge */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-widest">
                    Good
                  </div>
                  <span className="text-4xl font-black text-white">8–12<span className="text-2xl font-normal text-slate-300">ft</span></span>
                </div>
                <div className="text-slate-400 text-sm leading-relaxed">
                  Long-period NW groundswell<br />
                  <span className="text-slate-300">16s · Offshore NE winds</span>
                </div>
              </div>

              {/* Condition pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Swell', value: 'NW 285°', color: 'sky' },
                  { label: 'Wind', value: '8 mph NE', color: 'teal' },
                  { label: 'Water', value: '76°F', color: 'blue' },
                  { label: 'Tide', value: '2.1ft rising', color: 'cyan' },
                  { label: 'UV', value: 'High · 8', color: 'amber' },
                ].map(pill => (
                  <div key={pill.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
                    <span className="text-xs text-slate-400">{pill.label}</span>
                    <span className="text-xs font-semibold text-white">{pill.value}</span>
                  </div>
                ))}
              </div>

              {/* Fake wave chart bars */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">48-Hour Outlook</p>
                <div className="flex items-end gap-1 h-16">
                  {FAKE_WAVE_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm opacity-70"
                      style={{
                        height: `${h}%`,
                        background: `rgba(56,189,248,${0.3 + h / 200})`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">Now</span>
                  <span className="text-[10px] text-slate-400">+24h</span>
                  <span className="text-[10px] text-slate-400">+48h</span>
                </div>
              </div>

              {/* 3-day forecast pills */}
              <div className="grid grid-cols-3 gap-2">
                {FAKE_FORECAST.map(d => (
                  <div key={d.day} className="glass-card rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">{d.day}</p>
                    <p className="text-sm font-bold text-white">{d.height}</p>
                    <p className="text-[10px] text-slate-400">{d.period}</p>
                    <div className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${d.ratingClass}`}>
                      {d.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-4" id="pricing">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-white mb-3">Simple pricing</h2>
          <p className="text-center text-slate-300 mb-12">
            Start free. Cancel anytime. No surprise fees.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly */}
            <div className="glass-card rounded-2xl p-6 border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Monthly</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">$4</span>
                <span className="text-slate-300 mb-1">/month</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">Billed monthly · cancel anytime</p>
              <PricingCTA plan="monthly" isSignedIn={!!isSignedIn} loading={checkoutLoading} onCheckout={startCheckout} />
            </div>

            {/* Annual */}
            <div className="glass-card rounded-2xl p-6 border border-teal-500/25 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white">
                Best value · save 17%
              </div>
              <p className="text-xs text-teal-300 uppercase tracking-widest mb-3">Annual</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">$40</span>
                <span className="text-slate-300 mb-1">/year</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">That&apos;s $3.33/month · best rate</p>
              <PricingCTA plan="annual" isSignedIn={!!isSignedIn} loading={checkoutLoading} onCheckout={startCheckout} primary />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            {['7-day free trial', 'Cancel anytime', 'Secure payments via Stripe', 'No surprise fees'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#22c55e" strokeWidth="1.2" />
                  <path d="M3.5 6L5.5 8L8.5 4" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pb-16 text-center text-xs text-slate-400">
        Data from Open-Meteo · NOAA CO-OPS · DFO · All free, open sources
      </footer>
    </div>
  )
}

function PricingCTA({ plan, isSignedIn, loading, onCheckout, primary }: {
  plan: 'monthly' | 'annual'
  isSignedIn: boolean
  loading: 'monthly' | 'annual' | null
  onCheckout: (p: 'monthly' | 'annual') => void
  primary?: boolean
}) {
  const isLoading = loading === plan
  const cls = primary
    ? 'trial-cta-btn w-full py-3 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-60'
    : 'w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white font-semibold text-sm transition-colors disabled:opacity-60'

  if (isSignedIn) {
    return (
      <button onClick={() => onCheckout(plan)} disabled={!!loading} className={cls}>
        {isLoading ? 'Loading…' : 'Start 7-day free trial'}
      </button>
    )
  }

  return (
    <div onClick={() => localStorage.setItem('pendingCheckout', 'annual')}>
      <SignInButton mode="modal" forceRedirectUrl="/?checkout=1">
        <button disabled={!!loading} className={cls}>
          Start 7-day free trial
        </button>
      </SignInButton>
    </div>
  )
}

function ActivatingScreen() {
  return (
    <div className="theme-bg min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <WaveLogo size={48} />
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Activating your account…</h2>
        <p className="text-slate-400 text-sm">Confirming your subscription. This takes just a moment.</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function WaveLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: '🌍',
    title: 'Every spot on earth',
    desc: 'Search any beach, reef, or point break worldwide. If it has waves, we have data for it.',
  },
  {
    icon: '🌊',
    title: 'Live wave conditions',
    desc: 'Wave height, dominant period, and primary swell — updated every hour from marine buoy networks.',
  },
  {
    icon: '🧭',
    title: 'Swell direction & wind',
    desc: 'Know if the wind is offshore. See exactly where your swell is coming from with compass bearings.',
  },
  {
    icon: '🌙',
    title: 'Tide predictions',
    desc: 'Harmonic tide predictions from NOAA and DFO for US and Canada, plus a global tidal model for everywhere else.',
  },
  {
    icon: '📅',
    title: '10-day forecast',
    desc: 'Plan your sessions ahead. Daily surf ratings, swell summaries, wind outlook, and UV index.',
  },
  {
    icon: '🌡️',
    title: 'Water temperature',
    desc: 'Know what wetsuit to grab before you leave. Sea surface temperature for every location.',
  },
]

const FAKE_WAVE_BARS = [72, 78, 82, 88, 92, 88, 84, 80, 76, 78, 82, 86, 90, 86, 80, 74, 68, 65, 62, 64, 68, 72, 75, 78]

const FAKE_FORECAST = [
  { day: 'Today',    height: '8–12ft', period: '16s · NW',  rating: 'Good',  ratingClass: 'bg-green-500/20 text-green-300' },
  { day: 'Tomorrow', height: '6–9ft',  period: '14s · NW',  rating: 'Fair',  ratingClass: 'bg-yellow-500/20 text-yellow-300' },
  { day: 'Wed',      height: '4–6ft',  period: '12s · W',   rating: 'Poor',  ratingClass: 'bg-slate-500/20 text-slate-300' },
]

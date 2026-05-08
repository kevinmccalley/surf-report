'use client'

import { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  onClose: () => void
}

const FREE_FEATURES = [
  'Any surf spot worldwide',
  '3-day forecast & basic tides',
  'Current conditions & wind',
]

const INDIVIDUAL_FEATURES = [
  'Full 10-day forecast',
  '5-day tide curve + NOAA verification',
  'Full accuracy history (400+ days)',
  'Historical conditions (2022–today)',
  'Best surf right now — 608 spots',
]

const PREMIUM_FEATURES = [
  '15-day extended forecast',
  'Multi-model comparison (GFS vs NEMO)',
  'Swell alert notifications',
  'API access for developers',
]

export default function PaywallModal({ onClose }: Props) {
  const { isSignedIn } = useUser()
  const { t } = useLanguage()
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'annual' | 'monthly'>('annual')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function startCheckout(plan: 'monthly' | 'annual') {
    setLoadingPlan(plan)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error ?? 'Checkout failed. Please try again.')
      }
    } catch {
      setCheckoutError('Network error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ocean-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Header gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-teal-400 to-sky-600" />

        <div className="p-5 sm:p-7">
          {/* Headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 mb-3">
              <WaveIcon />
            </div>
            <h2 className="text-xl font-bold text-white">{t('paywall.title')}</h2>
            <p className="text-slate-400 text-sm mt-1">{t('paywall.subtitle')}</p>
          </div>

          {/* 3-tier comparison */}
          <div className="grid grid-cols-3 gap-3 mb-5">

            {/* Free tier */}
            <div className="flex flex-col rounded-xl border border-white/8 bg-white/3 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('paywall.tierFree')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-slate-500 font-medium">{t('paywall.currentPlan')}</span>
              </div>
              <p className="text-xl font-bold text-slate-300 mb-3">$0</p>
              <ul className="space-y-1.5 flex-1">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
                    <span className="text-slate-600 mt-0.5 shrink-0">–</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Individual $4 tier — highlighted */}
            <div className="flex flex-col rounded-xl border border-teal-500/35 bg-teal-500/7 p-3.5 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500 text-white whitespace-nowrap">
                {t('paywall.mostPopular')}
              </span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">{t('paywall.tierIndividual')}</span>
              </div>
              <div className="mb-3">
                <span className="text-xl font-bold text-white">
                  {billingPeriod === 'annual' ? '$3.33' : '$4'}
                </span>
                <span className="text-xs text-slate-500 ml-1">/mo</span>
                {billingPeriod === 'annual' && (
                  <p className="text-[10px] text-teal-400/80 mt-0.5">billed $40/year</p>
                )}
              </div>
              <ul className="space-y-1.5 flex-1">
                {INDIVIDUAL_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-tight">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5">
                      <path d="M2 5l2 2 4-4" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium $12 tier — coming soon */}
            <div className="flex flex-col rounded-xl border border-white/8 bg-white/3 p-3.5 opacity-60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('paywall.tierPremium')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium border border-sky-500/20">{t('paywall.comingSoon')}</span>
              </div>
              <p className="text-xl font-bold text-slate-300 mb-3">$12<span className="text-xs text-slate-500 font-normal ml-1">/mo</span></p>
              <ul className="space-y-1.5 flex-1">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5">
                      <rect x="2.5" y="5" width="5" height="3.5" rx="0.8" stroke="#475569" strokeWidth="1.2" />
                      <path d="M3.5 5V3.8a1.5 1.5 0 0 1 3 0V5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {t('paywall.monthly')} · $4/mo
            </button>
            <span className="text-slate-700 text-xs">·</span>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {t('paywall.annual')} · $40/yr
              <span className="ml-1.5 text-[10px] text-teal-400 font-semibold">–17%</span>
            </button>
          </div>

          {/* CTA */}
          {checkoutError && (
            <p className="text-center text-xs text-red-400 mb-3">{checkoutError}</p>
          )}
          {isSignedIn ? (
            <div className="space-y-2">
              <button
                onClick={() => startCheckout(billingPeriod)}
                disabled={!!loadingPlan}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 relative"
              >
                {loadingPlan ? t('paywall.loading') : t('paywall.startTrial')}
              </button>
              <p className="text-center text-[11px] text-slate-600">{t('paywall.couponNote')}</p>
              <button
                onClick={onClose}
                className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {t('paywall.maybeLater')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <SignInButton mode="modal" forceRedirectUrl="/?paywall=1">
                <button className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors">
                  {t('paywall.signInToStart')}
                </button>
              </SignInButton>
              <button
                onClick={onClose}
                className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {t('paywall.maybeLater')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WaveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

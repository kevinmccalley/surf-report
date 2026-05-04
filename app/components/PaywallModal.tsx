'use client'

import { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  onClose: () => void
}

export default function PaywallModal({ onClose }: Props) {
  const { isSignedIn } = useUser()
  const { t } = useLanguage()
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null)
  const [, setCoupon] = useState('')

  async function startCheckout(plan: 'monthly' | 'annual') {
    setLoadingPlan(plan)
    const priceId = plan === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ocean-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Header wave accent */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-teal-400 to-sky-600" />

        <div className="p-6 sm:p-8">
          {/* Icon + headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 mb-4">
              <WaveIcon />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('paywall.title')}</h2>
            <p className="text-slate-400 text-sm mt-2">
              {t('paywall.subtitle')}
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => isSignedIn ? startCheckout('monthly') : undefined}
              disabled={!!loadingPlan}
              className="relative flex flex-col items-center gap-1 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-sky-500/30 transition-all text-left group disabled:opacity-60"
            >
              <span className="text-xs text-slate-500 uppercase tracking-widest">{t('paywall.monthly')}</span>
              <span className="text-2xl font-bold text-white">$4</span>
              <span className="text-xs text-slate-500">{t('paywall.perMonth')}</span>
              {loadingPlan === 'monthly' && <Spinner />}
            </button>

            <button
              onClick={() => isSignedIn ? startCheckout('annual') : undefined}
              disabled={!!loadingPlan}
              className="relative flex flex-col items-center gap-1 p-4 rounded-xl border border-teal-500/30 bg-teal-500/8 hover:bg-teal-500/12 transition-all group disabled:opacity-60"
            >
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500 text-white whitespace-nowrap">
                {t('paywall.bestValue')}
              </span>
              <span className="text-xs text-teal-400 uppercase tracking-widest">{t('paywall.annual')}</span>
              <span className="text-2xl font-bold text-white">$40</span>
              <span className="text-xs text-slate-500">{t('paywall.perYear')}</span>
              {loadingPlan === 'annual' && <Spinner />}
            </button>
          </div>

          {/* Coupon note */}
          <p className="text-center text-xs text-slate-600 mb-5">
            {t('paywall.couponNote')}
          </p>

          {/* CTA */}
          {isSignedIn ? (
            <div className="space-y-2">
              <button
                onClick={() => startCheckout('annual')}
                disabled={!!loadingPlan}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loadingPlan ? t('paywall.loading') : t('paywall.startTrial')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
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
                className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {t('paywall.maybeLater')}
              </button>
            </div>
          )}

          {/* Perks */}
          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: '🌍', labelKey: 'paywall.perk1' },
              { icon: '🌊', labelKey: 'paywall.perk2' },
              { icon: '🔒', labelKey: 'paywall.perk3' },
            ].map(({ icon, labelKey }) => (
              <div key={labelKey} className="flex flex-col items-center gap-1">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] text-slate-500 leading-tight">{t(labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WaveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

function Spinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )
}

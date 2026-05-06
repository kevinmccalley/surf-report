'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Section {
  heading: string
  body: React.ReactNode
}

interface Props {
  title: string
  subtitle: string
  lastUpdated: string
  sections: Section[]
}

export default function LegalPage({ title, subtitle, lastUpdated, sections }: Props) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen theme-bg">
      <header className="sticky top-0 z-50 theme-header">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
              Groundswell
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
          <p className="text-slate-600 text-xs mt-1">{t('nav.lastUpdated')}: {lastUpdated}</p>
        </div>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i} className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-3">{s.heading}</h2>
              <div className="text-sm text-slate-300 leading-relaxed space-y-3">{s.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/terms"  className="hover:text-slate-300 transition-colors">{t('nav.terms')}</Link>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t('nav.privacy')}</Link>
          <Link href="/refund"  className="hover:text-slate-300 transition-colors">{t('nav.refund')}</Link>
          <Link href="/support" className="hover:text-slate-300 transition-colors">{t('nav.support')}</Link>
          <Link href="/"        className="hover:text-slate-300 transition-colors ml-auto">{t('nav.backToGroundswell')}</Link>
        </footer>
      </main>
    </div>
  )
}

function WaveLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="Groundswell">
      <circle cx="16" cy="16" r="16" fill="url(#wg)" />
      <path d="M6 19c2-3 4-5 6-4s3 4 5 4 4-4 6-4" stroke="white" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6 23c2-2 4-3.5 6-3s3 3 5 3 4-3 6-3" stroke="white" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".5" />
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

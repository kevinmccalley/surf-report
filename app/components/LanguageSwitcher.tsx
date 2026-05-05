'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage, LOCALES } from '@/app/i18n/LanguageContext'
import type { Locale } from '@/app/i18n/LanguageContext'

export default function LanguageSwitcher({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0]

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(code: Locale) {
    setLocale(code)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Change language"
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        <span className="font-mono font-semibold hidden sm:inline">{current.shortName}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className="opacity-50">
          <path d="M0 0l4 5 4-5z" />
        </svg>
      </button>

      {open && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1 w-48 rounded-xl shadow-xl py-1 z-50 theme-panel`}>
          {LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                l.code === locale ? 'theme-row-active' : 'theme-row-hover'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="theme-label">{l.label}</span>
              {l.code === locale && (
                <svg className="ml-auto w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="theme-check" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

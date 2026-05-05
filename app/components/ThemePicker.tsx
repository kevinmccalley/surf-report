'use client'

import { useState, useRef, useEffect } from 'react'
import { THEMES } from '@/app/lib/themes'
import { useTheme } from './ThemeProvider'
import { useLanguage } from '@/app/i18n/LanguageContext'

export default function ThemePicker({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { themeId, setTheme } = useTheme()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = THEMES.find(t => t.id === themeId) ?? THEMES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <PaletteIcon />
        <span className="hidden lg:block text-[11px] font-medium">{t('theme.' + current.id.replace(/-/g, '_'))}</span>
      </button>

      {open && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-52 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden theme-panel`}>
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-widest theme-label-muted mb-2.5">{t('theme.label')}</p>
            <div className="space-y-1">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => { setTheme(theme.id); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                    themeId === theme.id
                      ? 'theme-row-active'
                      : 'theme-row-hover'
                  }`}
                >
                  {/* Gradient swatch */}
                  <span
                    className="w-7 h-7 rounded-lg shrink-0 border border-white/10 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 60%, ${theme.preview[2]} 100%)`,
                    }}
                  />
                  <span className="text-xs font-medium theme-label flex-1 text-left">
                    {t('theme.' + theme.id.replace(/-/g, '_'))}
                  </span>
                  {!theme.dark && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-500 font-semibold">
                      {t('theme.light')}
                    </span>
                  )}
                  {themeId === theme.id && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="theme-check" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="5.5" r="1" fill="currentColor" />
      <circle cx="9" cy="5.5" r="1" fill="currentColor" />
      <circle cx="5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="9" cy="8.5" r="1" fill="currentColor" />
    </svg>
  )
}

'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import en from './messages/en'

export type Locale = 'en' | 'es' | 'fr' | 'pt-BR' | 'pt-PT'

export const LOCALES: { code: Locale; flag: string; label: string; shortName: string }[] = [
  { code: 'en',    flag: '🇺🇸', label: 'English',            shortName: 'EN' },
  { code: 'es',    flag: '🇪🇸', label: 'Español',            shortName: 'ES' },
  { code: 'fr',    flag: '🇫🇷', label: 'Français',           shortName: 'FR' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português (Brasil)', shortName: 'BR' },
  { code: 'pt-PT', flag: '🇵🇹', label: 'Português (PT)',     shortName: 'PT' },
]

// Map locale codes to BCP-47 tags for toLocaleDateString / toLocaleTimeString
export const LOCALE_BCP47: Record<Locale, string> = {
  'en':    'en-US',
  'es':    'es-ES',
  'fr':    'fr-FR',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
}

const STORAGE_KEY = 'groundswell_locale'

export type TFn = (key: string, vars?: Record<string, string | number>) => string

interface LanguageContextValue {
  locale: Locale
  bcp47: string
  setLocale: (locale: Locale) => void
  t: TFn
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  bcp47: 'en-US',
  setLocale: () => {},
  t: (k) => k,
})

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in vars ? String(vars[key]) : `{${key}}`
  })
}

const loaders: Record<Locale, () => Promise<Record<string, string>>> = {
  'en':    () => Promise.resolve(en),
  'es':    () => import('./messages/es').then(m => m.default),
  'fr':    () => import('./messages/fr').then(m => m.default),
  'pt-BR': () => import('./messages/pt-BR').then(m => m.default),
  'pt-PT': () => import('./messages/pt-PT').then(m => m.default),
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [messages, setMessages]   = useState<Record<string, string>>(en)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored && stored in loaders) loadLocale(stored)
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const loadLocale = useCallback(async (next: Locale) => {
    const msgs = await loaders[next]()
    setMessages(msgs)
    setLocaleState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }, [])

  const t = useCallback<TFn>((key, vars) => {
    const raw = messages[key] ?? en[key] ?? key
    return vars ? interpolate(raw, vars) : raw
  }, [messages])

  return (
    <LanguageContext.Provider value={{ locale, bcp47: LOCALE_BCP47[locale], setLocale: loadLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

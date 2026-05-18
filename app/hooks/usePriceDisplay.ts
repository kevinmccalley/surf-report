'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { Locale } from '@/app/i18n/LanguageContext'

const LOCALE_CURRENCY: Record<Locale, string> = {
  'en':    'USD',
  'es':    'EUR',
  'fr':    'EUR',
  'pt-BR': 'BRL',
  'pt-PT': 'EUR',
}

const CURRENCY_META: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$',  decimals: 2 },
  EUR: { symbol: '€',  decimals: 0 },
  BRL: { symbol: 'R$', decimals: 0 },
}

// Fallback rates against USD — updated May 2026
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.91,
  BRL: 5.80,
}

const CACHE_KEY = 'gw_fx_rates'
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours

async function fetchRates(): Promise<Record<string, number>> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { ts, rates } = JSON.parse(cached) as { ts: number; rates: Record<string, number> }
      if (Date.now() - ts < CACHE_TTL) return rates
    }
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json() as { result: string; rates: Record<string, number> }
    if (data.result === 'success') {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: data.rates }))
      return data.rates
    }
  } catch {}
  return FALLBACK_RATES
}

export function usePriceDisplay() {
  const { locale } = useLanguage()
  const currency = LOCALE_CURRENCY[locale]
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)

  useEffect(() => {
    fetchRates().then(setRates)
  }, [])

  function format(usdAmount: number): string {
    const meta = CURRENCY_META[currency] ?? CURRENCY_META.USD
    if (usdAmount === 0) return `${meta.symbol}0`
    if (currency === 'USD') {
      return `$${usdAmount % 1 === 0 ? usdAmount : usdAmount.toFixed(2)}`
    }
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1
    const converted = usdAmount * rate
    const rounded = meta.decimals === 0 ? Math.round(converted) : converted.toFixed(meta.decimals)
    return `~${meta.symbol}${rounded}`
  }

  return { format, currency }
}

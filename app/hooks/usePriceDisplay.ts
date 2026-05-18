'use client'

import { useLanguage } from '@/app/i18n/LanguageContext'
import type { Locale } from '@/app/i18n/LanguageContext'

const LOCALE_CURRENCY: Record<Locale, string> = {
  'en':    'USD',
  'es':    'EUR',
  'fr':    'EUR',
  'pt-BR': 'BRL',
  'pt-PT': 'EUR',
}

// Approximate rates against USD — display only, Stripe bills the actual amount
const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.91,
  BRL: 5.80,
}

const META: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$',  decimals: 2 },
  EUR: { symbol: '€',  decimals: 0 },
  BRL: { symbol: 'R$', decimals: 0 },
}

export function usePriceDisplay() {
  const { locale } = useLanguage()
  const currency = LOCALE_CURRENCY[locale] ?? 'USD'
  const meta     = META[currency]  ?? META.USD
  const rate     = RATES[currency] ?? 1

  function format(usdAmount: number): string {
    if (usdAmount === 0) return `${meta.symbol}0`
    if (currency === 'USD') {
      return `$${usdAmount % 1 === 0 ? usdAmount : usdAmount.toFixed(2)}`
    }
    const converted = usdAmount * rate
    const rounded   = meta.decimals === 0 ? Math.round(converted) : converted.toFixed(meta.decimals)
    return `~${meta.symbol}${rounded}`
  }

  return { format, currency }
}

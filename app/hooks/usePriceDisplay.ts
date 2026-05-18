'use client'

import { useLanguage } from '@/app/i18n/LanguageContext'

// Approximate rates against USD — display only; Stripe bills the actual amount
// Last updated May 2026 (EUR/USD ~1.13, USD/BRL ~5.70)
const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.88,
  BRL: 5.70,
}

const META: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$',  decimals: 2 },
  EUR: { symbol: '€',  decimals: 0 },
  BRL: { symbol: 'R$', decimals: 0 },
}

export function usePriceDisplay() {
  const { t } = useLanguage()
  // Use t() so currency updates in the same render as translated text
  const currency = t('currency.code') || 'USD'
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

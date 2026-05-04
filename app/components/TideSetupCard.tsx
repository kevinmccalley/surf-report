'use client'

import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  reason?: string
}

export default function TideSetupCard({ reason }: Props) {
  void reason
  const { t } = useLanguage()
  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-slate-700/50 bg-white/3">
      <span className="text-xl shrink-0 mt-0.5">📡</span>
      <div>
        <p className="text-sm font-semibold text-slate-300">{t('tideSetup.unavailable')}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {t('tideSetup.desc')}
        </p>
      </div>
    </div>
  )
}

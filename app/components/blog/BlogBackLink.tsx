'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'

export default function BlogBackLink() {
  const { t } = useLanguage()
  return (
    <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-sky-400 transition-colors">
      ← {t('nav.backToGroundswell')}
    </Link>
  )
}

export function BlogNoPostsMessage() {
  const { t } = useLanguage()
  return (
    <div className="text-center py-20 text-[var(--color-text-muted)]">
      <p className="text-lg">{t('blog.noPostsYet')}</p>
    </div>
  )
}

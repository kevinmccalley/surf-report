'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'

export default function BlogHeader() {
  const { t } = useLanguage()
  return (
    <div className="mb-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-3">
        {t('blog.heading')}
      </h1>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[var(--color-text-secondary)]">
          {t('blog.subtitle')}
        </p>
        <Link
          href="/blog/rss.xml"
          className="text-sm text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
          </svg>
          {t('blog.rssLink')}
        </Link>
      </div>
    </div>
  )
}

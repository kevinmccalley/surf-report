'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/app/i18n/LanguageContext'
import PaywallModal from '@/app/components/PaywallModal'
import type { RegionMapPoint } from '@/app/lib/region-map'

const RegionMap = dynamic(() => import('@/app/components/RegionMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse" style={{ background: 'var(--search-bg)' }} />,
})

export interface DetailPoint extends RegionMapPoint {
  href: string
}

interface Props {
  /** Region or country display name (proper noun, not translated). */
  name: string
  points: DetailPoint[]
  bounds?: [[number, number], [number, number]] | null
  locked: boolean
  /** Extra names this region resolves from in search. */
  aliases?: string[]
  /** Link to the country-aggregate route, when the country has more than one region. */
  countryLink?: { href: string; country: string } | null
}

export default function RegionDetailClient({ name, points, bounds, locked, aliases, countryLink }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,21rem)_1fr] lg:gap-6">
        {/* ── Spot list ─────────────────────────────────────────────── */}
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            {t('regions.detail.spotsHeading')}
          </h2>

          <ol className="flex flex-col gap-1.5">
            {points.map((p, i) => {
              const inner = (
                <>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-[11px] font-bold text-teal-300 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                    {p.locality && <span className="block truncate text-xs text-slate-500">{p.locality}</span>}
                  </span>
                </>
              )
              const cls =
                'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors w-full ' +
                (activeSlug === p.slug
                  ? 'border-teal-500/50 bg-teal-500/10'
                  : 'border-white/8 hover:border-teal-500/30 hover:bg-white/[0.03]')

              return (
                <li key={p.slug}>
                  {locked ? (
                    <div className={cls}>{inner}</div>
                  ) : (
                    <Link
                      href={p.href}
                      className={cls}
                      onMouseEnter={() => setActiveSlug(p.slug)}
                      onMouseLeave={() => setActiveSlug(null)}
                      onFocus={() => setActiveSlug(p.slug)}
                      onBlur={() => setActiveSlug(null)}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>

          {aliases && aliases.length > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              <span className="text-slate-400">{t('regions.detail.alsoKnownAs')}:</span> {aliases.join(' · ')}
            </p>
          )}

          {countryLink && (
            <Link
              href={countryLink.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              {t('regions.detail.countryLink', { country: countryLink.country })}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* ── Map / lock panel ──────────────────────────────────────── */}
        <div className="min-w-0">
          {locked ? (
            <div className="flex h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-teal-500/30 bg-gradient-to-b from-teal-500/[0.07] to-transparent px-6 text-center lg:h-[560px]">
              <svg className="mb-4 h-8 w-8 text-teal-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="text-base font-semibold text-white">
                {t('regions.locked.title', { count: points.length, region: name })}
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-slate-400">{t('regions.locked.body')}</p>
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
              >
                {t('regions.locked.cta')}
              </button>
              <p className="mt-3 text-xs text-slate-500">{t('regions.locked.freeNote')}</p>
            </div>
          ) : (
            <div className="h-[340px] overflow-hidden rounded-xl border border-white/10 sm:h-[440px] lg:h-[560px]">
              <RegionMap
                points={points}
                bounds={bounds}
                activeSlug={activeSlug}
                onHover={setActiveSlug}
                onSelect={slug => {
                  const p = points.find(pt => pt.slug === slug)
                  if (p) router.push(p.href)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useUser } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'
import PaywallModal from '@/app/components/PaywallModal'
import type { RegionMapPoint } from '@/app/lib/region-map'
import type { SubscriptionTier } from '@/app/lib/subscription'
import { MAX_PICKED_REGIONS } from '@/app/lib/region-picks'
import { ratingColor, type SpotConditions, type RegionConditionsSnapshot } from '@/app/lib/spot-conditions'
import { formatWaveHeight } from '@/app/lib/utils'

const RegionMap = dynamic(() => import('@/app/components/RegionMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse" style={{ background: 'var(--bg-start)' }} />,
})

export interface DetailPoint extends RegionMapPoint {
  href: string
}

interface Props {
  /** Region or country display name (proper noun, not translated). */
  name: string
  /** Pre-composed context line: "Europe · Portugal · CA" or the country subtitle sentence. */
  subtitle: string
  points: DetailPoint[]
  bounds?: [[number, number], [number, number]] | null
  locked: boolean
  /** Region only — shows the "Free sample" badge. */
  flagship?: boolean
  /** Extra names this region resolves from in search. */
  aliases?: string[]
  /** Country page only — chips linking to each member region. */
  memberRegions?: { slug: string; name: string }[]
  /** Link to the country-aggregate route, when the country has more than one region. */
  countryLink?: { href: string; country: string } | null
  /** Region slug — enables the individual-tier "add to My Regions" path on the lock panel. */
  regionSlug?: string
  tier?: SubscriptionTier
  /** The viewer's current "My Regions" picks (individual tier). */
  picks?: string[]
}

export default function RegionDetailClient({
  name,
  subtitle,
  points,
  bounds,
  locked,
  flagship,
  aliases,
  memberRegions,
  countryLink,
  regionSlug,
  tier,
  picks = [],
}: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useUser()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [savingPick, setSavingPick] = useState(false)
  const [pickError, setPickError] = useState(false)
  const [conditions, setConditions] = useState<Record<string, SpotConditions>>()

  const canPick = tier === 'individual' && !!regionSlug
  const slotsLeft = MAX_PICKED_REGIONS - picks.length

  // Premium: pull the live-conditions snapshot once and colour the map pins by
  // rating. Skipped for other tiers and when the map isn't shown (locked).
  useEffect(() => {
    if (tier !== 'premium' || locked) return
    let cancelled = false
    fetch('/api/regions/conditions')
      .then(res => (res.ok ? res.json() : null))
      .then((data: RegionConditionsSnapshot | null) => {
        if (!cancelled && data?.spots) setConditions(data.spots)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tier, locked])

  async function addPick() {
    if (!regionSlug || savingPick) return
    setSavingPick(true)
    setPickError(false)
    try {
      const res = await fetch('/api/regions/picks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: [...picks, regionSlug] }),
      })
      if (!res.ok) throw new Error(String(res.status))
      await user?.reload()
      router.refresh()
    } catch {
      setPickError(true)
    } finally {
      setSavingPick(false)
    }
  }

  return (
    <>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <main id="main-content" className="relative isolate min-h-0 flex-1">
        {/* ── Full-bleed map (or lock CTA) ──────────────────────────── */}
        {locked ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ background: 'var(--bg-start)' }}
          >
            <svg className="mb-4 h-8 w-8 text-teal-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-base font-semibold text-white">
              {t('regions.locked.title', { count: points.length, region: name })}
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-slate-400">{t('regions.locked.body')}</p>

            {canPick && slotsLeft > 0 ? (
              <>
                <button
                  onClick={addPick}
                  disabled={savingPick}
                  className="mt-5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:opacity-60"
                >
                  {t('regions.picker.addCta')}
                </button>
                <p className="mt-3 text-xs text-slate-500">
                  {t('regions.picker.count', { count: picks.length, max: MAX_PICKED_REGIONS })}
                </p>
                {pickError && <p className="mt-1 text-xs text-rose-400">{t('regions.picker.error')}</p>}
              </>
            ) : canPick ? (
              <>
                <p className="mt-4 max-w-sm text-xs text-slate-500">{t('regions.picker.fullDetail')}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/regions"
                    className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
                  >
                    {t('regions.picker.manageCta')}
                  </Link>
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-teal-500/50"
                  >
                    {t('regions.picker.premiumCta')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="mt-5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
                >
                  {t('regions.locked.cta')}
                </button>
                <p className="mt-3 text-xs text-slate-500">{t('regions.locked.freeNote')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <RegionMap
              points={points}
              bounds={bounds}
              activeSlug={activeSlug}
              conditions={conditions}
              onHover={setActiveSlug}
              onSelect={slug => {
                const p = points.find(pt => pt.slug === slug)
                if (p) router.push(p.href)
              }}
            />
          </div>
        )}

        {/* ── Floating spot panel, over the left edge of the map ────── */}
        <div
          className="absolute left-3 top-3 z-[1000] flex max-h-[46vh] w-[calc(100%-1.5rem)] max-w-[21rem] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md md:bottom-4 md:left-4 md:max-h-none"
          style={{ background: 'var(--panel-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <Link
              href="/regions"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('regions.detail.backToRegions')}
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">{name}</h1>
              {flagship && (
                <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-300">
                  {t('regions.flagshipBadge')}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

            {memberRegions && memberRegions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {memberRegions.map(r => (
                  <Link
                    key={r.slug}
                    href={`/regions/${r.slug}`}
                    className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-teal-500/40 hover:text-white"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            )}

            <h2 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {t('regions.detail.spotsHeading')}
            </h2>

            <ol className="flex flex-col gap-1.5">
              {points.map((p, i) => {
                const cond = conditions?.[p.slug]
                const inner = (
                  <>
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
                      style={
                        cond
                          ? { background: `${ratingColor(cond.ratingLabel) ?? '#14b8a6'}22`, color: ratingColor(cond.ratingLabel) ?? '#5eead4' }
                          : { background: 'rgba(20,184,166,0.15)', color: '#5eead4' }
                      }
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                      {cond ? (
                        <span className="block truncate text-xs tabular-nums" style={{ color: ratingColor(cond.ratingLabel) ?? '#94a3b8' }}>
                          {formatWaveHeight(cond.waveHeight, 'ft')} · {Math.round(cond.wavePeriod)}s · {Math.round(cond.windSpeed)} km/h {cond.swellDirLabel}
                        </span>
                      ) : (
                        p.locality && <span className="block truncate text-xs text-slate-500">{p.locality}</span>
                      )}
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
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-sky-400 transition-colors hover:text-sky-300"
              >
                {t('regions.detail.countryLink', { country: countryLink.country })}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

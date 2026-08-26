'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { CONTINENTS, CONTINENT_I18N, type Continent } from '@/app/lib/continents'
import type { SubscriptionTier } from '@/app/lib/subscription'
import { MAX_PICKED_REGIONS } from '@/app/lib/region-picks'

export interface RegionCard {
  slug: string
  name: string
  continent: Continent
  spotCount: number
  flagship: boolean
  locked: boolean
  aliases: string[]
}

interface Props {
  regions: RegionCard[]
  tier: SubscriptionTier
  initialPicks: string[]
}

export default function RegionsIndexClient({ regions, tier, initialPicks }: Props) {
  const { t } = useLanguage()
  const { user } = useUser()
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState<string>('all')

  const [picks, setPicks] = useState<string[]>(initialPicks)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const canPick = tier === 'individual'
  const atLimit = picks.length >= MAX_PICKED_REGIONS
  const pickedSet = useMemo(() => new Set(picks), [picks])

  async function togglePick(slug: string) {
    if (!canPick || saving) return
    const isPicked = pickedSet.has(slug)
    if (!isPicked && atLimit) return

    const next = isPicked ? picks.filter(s => s !== slug) : [...picks, slug]
    const prev = picks
    setPicks(next)
    setSaving(true)
    setError(false)
    try {
      const res = await fetch('/api/regions/picks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: next }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { picks?: string[] }
      if (Array.isArray(data.picks)) setPicks(data.picks)
      await user?.reload()
    } catch {
      setPicks(prev)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  const isLocked = (r: RegionCard) => {
    if (r.flagship || tier === 'premium') return false
    if (canPick) return !pickedSet.has(r.slug)
    return r.locked
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return regions.filter(r => {
      if (continent !== 'all' && r.continent !== continent) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.aliases.some(a => a.toLowerCase().includes(q))
      )
    })
  }, [regions, search, continent])

  const pickedRegions = useMemo(
    () => picks.map(slug => regions.find(r => r.slug === slug)).filter((r): r is RegionCard => !!r),
    [picks, regions],
  )

  return (
    <div>
      {canPick && (
        <section className="mb-6 rounded-xl border border-teal-500/25 bg-teal-500/[0.06] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold text-white">{t('regions.picker.heading')}</h2>
            <span className="text-xs tabular-nums text-teal-300">
              {t('regions.picker.count', { count: picks.length, max: MAX_PICKED_REGIONS })}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('regions.picker.help')}</p>

          {pickedRegions.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {pickedRegions.map(r => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => togglePick(r.slug)}
                    disabled={saving}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/15 py-1 pl-2.5 pr-2 text-xs text-teal-200 transition-colors hover:border-teal-400/70 disabled:opacity-50"
                  >
                    {r.name}
                    <svg className="h-3 w-3 text-teal-300/70 transition-colors group-hover:text-teal-100" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    <span className="sr-only">{t('regions.picker.remove', { region: r.name })}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">{t('regions.picker.empty')}</p>
          )}

          {error && <p className="mt-2 text-xs text-rose-400">{t('regions.picker.error')}</p>}
        </section>
      )}

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('regions.searchPlaceholder')}
        className="mb-4 w-full rounded-lg search-input px-3 py-2 text-sm focus:outline-none"
      />

      {/* Continent chips */}
      <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
        <button
          onClick={() => setContinent('all')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            continent === 'all' ? 'bg-teal-500 text-white' : 'theme-inset text-slate-400 hover:border-teal-500/40'
          }`}
        >
          {t('regions.allContinents')}
        </button>
        {CONTINENTS.map(c => (
          <button
            key={c}
            onClick={() => setContinent(continent === c ? 'all' : c)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              continent === c ? 'bg-teal-500 text-white' : 'theme-inset text-slate-400 hover:border-teal-500/40'
            }`}
          >
            {t(CONTINENT_I18N[c])}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-slate-500">{t('regions.regionCount', { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">{t('regions.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => {
            const locked = isLocked(r)
            const picked = pickedSet.has(r.slug)
            const pickBlocked = canPick && !picked && atLimit
            return (
              <Link
                key={r.slug}
                href={`/regions/${r.slug}`}
                className="group flex h-full flex-col rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 transition-colors hover:border-teal-500/40 hover:bg-teal-500/10"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="min-w-0 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-teal-300">
                    {r.name}
                  </h2>

                  {r.flagship ? (
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-300">
                      {t('regions.flagshipBadge')}
                    </span>
                  ) : canPick ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        togglePick(r.slug)
                      }}
                      disabled={saving || pickBlocked}
                      aria-pressed={picked}
                      title={pickBlocked ? t('regions.picker.full') : undefined}
                      className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors disabled:opacity-40 ${
                        picked
                          ? 'border-teal-500/50 bg-teal-500/20 text-teal-200 hover:border-teal-400/70'
                          : 'border-white/15 text-slate-300 hover:border-teal-500/50 hover:text-teal-200'
                      }`}
                    >
                      {picked ? (
                        <>
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 10 18l9.5-11" />
                          </svg>
                          {t('regions.picker.unlocked')}
                        </>
                      ) : (
                        <>
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          {t('regions.picker.pick')}
                        </>
                      )}
                    </button>
                  ) : locked ? (
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75M6.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      {t('regions.lockedBadge')}
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-wrap gap-1">
                  <span className="rounded-full theme-inset px-2 py-0.5 text-xs text-slate-400">
                    {t(CONTINENT_I18N[r.continent])}
                  </span>
                  <span className="rounded-full theme-inset px-2 py-0.5 text-xs text-slate-400">
                    {t('directory.spotCount', { count: r.spotCount })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

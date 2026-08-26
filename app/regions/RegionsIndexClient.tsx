'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'
import { CONTINENTS, CONTINENT_I18N, type Continent } from '@/app/lib/continents'

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
}

export default function RegionsIndexClient({ regions }: Props) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState<string>('all')

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

  return (
    <div>
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
          {filtered.map(r => (
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
                ) : r.locked ? (
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
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { DirectorySpot } from '@/app/lib/spots-directory'

const REGIONS = [
  'Hawaii',
  'North America',
  'Latin America',
  'Europe',
  'Africa & Atlantic',
  'Indian Ocean',
  'Southeast Asia',
  'Oceania & Pacific',
] as const

const REGION_I18N: Record<string, string> = {
  'Hawaii':           'top100.region.hawaii',
  'North America':    'top100.region.northAmerica',
  'Latin America':    'top100.region.latinAmerica',
  'Europe':           'top100.region.europe',
  'Africa & Atlantic':'top100.region.africaAtlantic',
  'Indian Ocean':     'top100.region.indianOcean',
  'Southeast Asia':   'top100.region.southeastAsia',
  'Oceania & Pacific':'top100.region.oceania',
}

const DIFFICULTY_STYLE: Record<string, string> = {
  'Beginner':     'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Intermediate': 'text-sky-400    bg-sky-500/10     border-sky-500/30',
  'Advanced':     'text-amber-400  bg-amber-500/10   border-amber-500/30',
  'Expert':       'text-red-400    bg-red-500/10     border-red-500/30',
}

interface Props {
  spots: DirectorySpot[]
}

export default function SpotsDirectoryClient({ spots }: Props) {
  const { t } = useLanguage()
  const [search, setSearch]   = useState('')
  const [region, setRegion]   = useState<string>('all')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return spots
      .filter(s => {
        if (region !== 'all' && s.region !== region) return false
        if (q && !s.name.toLowerCase().includes(q) && !s.locality.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name)
        return sortAsc ? cmp : -cmp
      })
  }, [spots, search, region, sortAsc])

  return (
    <div>
      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('directory.searchPlaceholder')}
          className="flex-1 bg-slate-800/60 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
        />
        <button
          onClick={() => setSortAsc(v => !v)}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-800/60 border border-[var(--color-border)] text-sm text-slate-300 hover:text-white hover:border-teal-500/40 transition-colors"
          aria-label={sortAsc ? t('directory.sortZA') : t('directory.sortAZ')}
        >
          {sortAsc ? t('directory.sortAZ') : t('directory.sortZA')}
        </button>
      </div>

      {/* Region chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setRegion('all')}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            region === 'all'
              ? 'bg-teal-500 text-white'
              : 'bg-slate-800/60 border border-[var(--color-border)] text-slate-400 hover:text-white'
          }`}
        >
          {t('directory.allRegions')}
        </button>
        {REGIONS.map(r => (
          <button
            key={r}
            onClick={() => setRegion(region === r ? 'all' : r)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              region === r
                ? 'bg-teal-500 text-white'
                : 'bg-slate-800/60 border border-[var(--color-border)] text-slate-400 hover:text-white'
            }`}
          >
            {t(REGION_I18N[r])}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500 mb-5">
        {t('directory.spotCount', { count: filtered.length })}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm py-12 text-center">{t('directory.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(spot => (
            <Link
              key={`${spot.slug}-${spot.lat}`}
              href={`/spots/${spot.slug}`}
              className="group block h-full rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 hover:bg-teal-500/10 hover:border-teal-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <h2 className="font-semibold text-white text-sm leading-snug group-hover:text-teal-300 transition-colors truncate">
                    {spot.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{spot.locality}</p>
                </div>
                {spot.wslBadge && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    {spot.wslBadge}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
                  {t(REGION_I18N[spot.region])}
                </span>
                {spot.waveType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
                    {spot.waveType}
                  </span>
                )}
                {spot.difficulty && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[spot.difficulty] ?? 'text-slate-400 bg-slate-700/60 border-slate-600/40'}`}>
                    {spot.difficulty}
                  </span>
                )}
                {spot.bestSeason && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
                    {spot.bestSeason}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

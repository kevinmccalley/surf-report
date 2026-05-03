'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'
import type { GeoResult } from '@/app/lib/types'
import { searchSurfSpots } from '@/app/lib/surf-spots'

interface Props {
  onSelect: (result: GeoResult) => void
  loading?: boolean
  compact?: boolean
  autoFocus?: boolean
}

export default function SearchBar({ onSelect, loading, compact, autoFocus }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Recompute which results are known surf spots whenever query or results change
  const surfSpotKeys = useMemo(() => {
    const spots = searchSurfSpots(query)
    return new Set(spots.map(s => `${s.lat},${s.lon}`))
  }, [query])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setSearching(true)

    // Surf spots are local — show instantly before geocoding returns
    const spotResults = searchSurfSpots(q)
    if (spotResults.length > 0) {
      setResults(spotResults)
      setOpen(true)
      setActiveIdx(-1)
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const geoResults: GeoResult[] = data.results ?? []

      // Merge: surf spots first, then geo results not already covered by a spot
      const combined = [
        ...spotResults,
        ...geoResults.filter(g =>
          !spotResults.some(s => Math.hypot(s.lat - g.lat, s.lon - g.lon) < 0.15)
        ),
      ].slice(0, 8)

      setResults(combined)
      setOpen(combined.length > 0)
      setActiveIdx(-1)
    } finally {
      setSearching(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  const handleSelect = (result: GeoResult) => {
    setQuery(result.name + (result.country ? `, ${result.country}` : ''))
    setOpen(false)
    setResults([])
    onSelect(result)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]) }
    if (e.key === 'Escape') { setOpen(false) }
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`relative flex items-center search-input rounded-xl ${compact ? 'rounded-lg' : 'rounded-xl'}`}>
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {searching || loading
            ? <Loader2 size={16} className="animate-spin text-sky-400" />
            : <Search size={16} />
          }
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={compact ? 'Search any beach or surf spot…' : 'Search any beach, surf spot, or city…'}
          className={`w-full bg-transparent text-white placeholder-slate-500 pl-9 pr-9 focus:outline-none ${
            compact ? 'py-2 text-sm' : 'py-3.5 text-base'
          }`}
          aria-label="Search surf location"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden shadow-2xl border border-white/10" style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)' }}>
          {results.map((r, i) => {
            const isSurfSpot = surfSpotKeys.has(`${r.lat},${r.lon}`)
            return (
              <button
                key={`${r.lat}-${r.lon}`}
                onMouseDown={() => handleSelect(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === activeIdx ? 'bg-sky-500/15' : 'hover:bg-white/5'
                } ${i < results.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <MapPin size={14} className="text-sky-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">{r.state ? `${r.state}, ` : ''}{r.country}</p>
                </div>
                {isSurfSpot && (
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-sky-400 border border-sky-500/30 rounded px-1 py-0.5">
                    surf
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

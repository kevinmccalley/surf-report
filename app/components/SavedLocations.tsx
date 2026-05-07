'use client'

import { useState, useRef, useEffect } from 'react'
import { Bookmark, X } from 'lucide-react'
import type { SavedLocation } from '@/app/lib/types'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  locations: SavedLocation[]
  onSelect: (loc: SavedLocation) => void
  onRemove: (lat: number, lon: number) => void
}

export default function SavedLocations({ locations, onSelect, onRemove }: Props) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSaved = locations.length > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={t('locations.yourSpots')}
        className="relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bookmark
          size={14}
          className={hasSaved ? 'fill-teal-400 text-teal-400' : ''}
        />
        {hasSaved && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-teal-500 text-[8px] font-bold text-white flex items-center justify-center leading-none">
            {locations.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden theme-panel">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-widest theme-label-muted mb-2.5">
              {t('locations.yourSpots')}
            </p>
            {locations.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">{t('locations.noSaved')}</p>
            ) : (
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {locations.map(loc => (
                  <div key={`${loc.lat}-${loc.lon}`} className="flex items-center gap-1 group">
                    <button
                      onClick={() => { onSelect(loc); setOpen(false) }}
                      className="flex-1 text-left px-2.5 py-2 rounded-xl text-xs theme-row-hover theme-label transition-colors min-w-0"
                    >
                      <span className="block font-medium truncate">{loc.name}</span>
                      {loc.country && (
                        <span className="block text-[10px] theme-label-muted truncate">{loc.country}</span>
                      )}
                    </button>
                    <button
                      onClick={() => onRemove(loc.lat, loc.lon)}
                      title={t('locations.remove')}
                      className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

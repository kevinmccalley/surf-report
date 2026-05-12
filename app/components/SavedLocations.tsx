'use client'

import { useState, useRef, useEffect } from 'react'
import { Bookmark, X, Bell, BellRing, Check } from 'lucide-react'
import type { SavedLocation } from '@/app/lib/types'
import { useLanguage } from '@/app/i18n/LanguageContext'

const M_TO_FT = 3.28084

interface Props {
  locations: SavedLocation[]
  heightUnit: 'ft' | 'm'
  onSelect: (loc: SavedLocation) => void
  onRemove: (lat: number, lon: number) => void
  onSetAlert: (lat: number, lon: number, thresholdM: number | null) => void
}

export default function SavedLocations({ locations, heightUnit, onSelect, onRemove, onSetAlert }: Props) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<{ lat: number; lon: number; value: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setEditingAlert(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSaved = locations.length > 0

  function openAlertEditor(loc: SavedLocation) {
    if (editingAlert?.lat === loc.lat && editingAlert?.lon === loc.lon) {
      setEditingAlert(null)
      return
    }
    const current = loc.alertThreshold != null
      ? (heightUnit === 'ft'
          ? (loc.alertThreshold * M_TO_FT).toFixed(1)
          : loc.alertThreshold.toFixed(1))
      : ''
    setEditingAlert({ lat: loc.lat, lon: loc.lon, value: current })
  }

  function handleSaveAlert(loc: SavedLocation) {
    const num = parseFloat(editingAlert?.value ?? '')
    if (isNaN(num) || num <= 0) return
    const thresholdM = heightUnit === 'ft' ? num / M_TO_FT : num
    onSetAlert(loc.lat, loc.lon, thresholdM)
    setEditingAlert(null)
  }

  function handleClearAlert(loc: SavedLocation) {
    onSetAlert(loc.lat, loc.lon, null)
    setEditingAlert(null)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); setEditingAlert(null) }}
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
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden theme-panel">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-widest theme-label-muted mb-2.5">
              {t('locations.yourSpots')}
            </p>
            {locations.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">{t('locations.noSaved')}</p>
            ) : (
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {locations.map(loc => {
                  const isEditingThis = editingAlert?.lat === loc.lat && editingAlert?.lon === loc.lon
                  const hasAlert = loc.alertThreshold != null
                  const alertDisplay = hasAlert
                    ? (heightUnit === 'ft'
                        ? `${(loc.alertThreshold! * M_TO_FT).toFixed(1)}ft`
                        : `${loc.alertThreshold!.toFixed(1)}m`)
                    : null

                  return (
                    <div key={`${loc.lat}-${loc.lon}`}>
                      <div className="flex items-center gap-1 group">
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
                          onClick={() => openAlertEditor(loc)}
                          title={t('locations.setAlert')}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            hasAlert
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-white/10'
                              : 'text-slate-600 hover:text-slate-300 hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                        >
                          {hasAlert ? <BellRing size={11} /> : <Bell size={11} />}
                        </button>
                        <button
                          onClick={() => onRemove(loc.lat, loc.lon)}
                          title={t('locations.remove')}
                          className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <X size={11} />
                        </button>
                      </div>

                      {hasAlert && !isEditingThis && (
                        <div className="ml-2.5 mb-1 text-[10px] alert-badge text-amber-400 opacity-80 flex items-center gap-1">
                          <BellRing size={9} />
                          {t('locations.alertActive').replace('{v}', alertDisplay!)}
                        </div>
                      )}

                      {isEditingThis && (
                        <div className="mx-2 mb-2 p-2.5 rounded-xl theme-inset">
                          <p className="text-[10px] theme-label-muted mb-1.5">{t('locations.alertWhen')}</p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              placeholder={heightUnit === 'ft' ? '3.0' : '1.0'}
                              value={editingAlert.value}
                              onChange={e => setEditingAlert(prev => prev ? { ...prev, value: e.target.value } : prev)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveAlert(loc)}
                              className="w-16 px-2 py-1 rounded-lg search-input text-xs"
                              autoFocus
                            />
                            <span className="text-xs theme-label-muted">{heightUnit}</span>
                            <button
                              onClick={() => handleSaveAlert(loc)}
                              className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                            >
                              <Check size={11} />
                            </button>
                            {hasAlert && (
                              <button
                                onClick={() => handleClearAlert(loc)}
                                className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors px-1"
                              >
                                {t('locations.clearAlert')}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

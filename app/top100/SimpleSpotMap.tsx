'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  lat: number
  lon: number
  name: string
  onClose: () => void
}

function makePin(color = '#22d3ee'): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
    html: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.25)"/>
      <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 26 12 26S28 21 28 12C28 5.373 22.627 0 16 0Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="16" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
  })
}

export default function SimpleSpotMap({ lat, lon, name, onClose }: Props) {
  const { t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 10,
      zoomControl: false,
    })
    mapRef.current = map

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map)

    const marker = L.marker([lat, lon], { icon: makePin() })
    const coordStr = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`
    marker.bindPopup(
      `<div style="font-family:system-ui,sans-serif;color:#f1f5f9;padding:4px 2px;min-width:140px">
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">${name}</div>
        <div style="font-size:11px;color:#94a3b8;font-variant-numeric:tabular-nums">${coordStr}</div>
      </div>`,
      { className: 'simple-map-popup', closeButton: false }
    )
    marker.addTo(map)
    setTimeout(() => marker.openPopup(), 400)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lon, name])

  const coordLabel = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--panel-bg, #0f172a)' }}>
            <div>
              <p className="font-semibold text-sm text-slate-100">{name}</p>
              <p className="text-xs text-slate-400 font-mono">{coordLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none p-1"
              aria-label={t('top100.closeMap')}
            >
              ✕
            </button>
          </div>

          {/* Map */}
          <div ref={containerRef} style={{ height: 360 }} />
        </motion.div>
      </motion.div>

      {/* Popup styles */}
      <style>{`
        .simple-map-popup .leaflet-popup-content-wrapper {
          background: #1e293b !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .simple-map-popup .leaflet-popup-content {
          margin: 10px 14px !important;
        }
        .simple-map-popup .leaflet-popup-tip {
          background: #1e293b !important;
        }
      `}</style>
    </AnimatePresence>
  )
}

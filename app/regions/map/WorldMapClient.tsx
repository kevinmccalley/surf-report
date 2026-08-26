'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { RegionShape, WorldSpot } from '@/app/lib/region-hull'

const WorldRegionsMap = dynamic(() => import('@/app/components/WorldRegionsMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse" style={{ background: 'var(--bg-start)' }} />,
})

interface Props {
  shapes: RegionShape[]
  spots: WorldSpot[]
  regionCount: number
  spotCount: number
}

export default function WorldMapClient({ shapes, spots, regionCount, spotCount }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const hoveredName = hovered ? shapes.find(s => s.slug === hovered)?.name ?? null : null

  return (
    <main id="main-content" className="relative isolate min-h-0 flex-1">
      <div className="absolute inset-0">
        <WorldRegionsMap
          shapes={shapes}
          spots={spots}
          onHoverRegion={setHovered}
          onSelectRegion={slug => router.push(`/regions/${slug}`)}
          onSelectSpot={slug => router.push(`/spots/${slug}`)}
        />
      </div>

      {/* ── Title / stats, over the top-left of the map ──────────────────── */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000]">
        <div
          className="pointer-events-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur-md"
          style={{ background: 'var(--panel-bg)', borderColor: 'var(--card-border)' }}
        >
          <Link
            href="/regions"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {t('regions.detail.backToRegions')}
          </Link>
          <span className="h-3.5 w-px bg-white/15" aria-hidden />
          <h1 className="text-sm font-bold text-white">{t('regions.map.heading')}</h1>
          <span className="text-xs tabular-nums text-slate-500">
            {t('regions.map.stats', { regions: regionCount, spots: spotCount })}
          </span>
        </div>
      </div>

      {/* ── Hint / hovered region name, bottom-centre ────────────────────── */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 px-3">
        <div
          className="max-w-[90vw] truncate rounded-full border px-3.5 py-1.5 text-center text-xs shadow-xl backdrop-blur-md"
          style={{ background: 'var(--panel-bg)', borderColor: 'var(--card-border)' }}
        >
          {hoveredName ? (
            <span className="font-semibold text-teal-300">{hoveredName}</span>
          ) : (
            <span className="text-slate-400">{t('regions.map.hint')}</span>
          )}
        </div>
      </div>
    </main>
  )
}

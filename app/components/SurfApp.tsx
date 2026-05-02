'use client'

import { useState, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import type { SurfReport, TideReport, TideUnavailable, GeoResult } from '@/app/lib/types'
import SearchBar from './SearchBar'
import HeroSection from './HeroSection'
import ConditionCards from './ConditionCards'
import WaveChart from './WaveChart'
import ForecastGrid from './ForecastGrid'
import TideSection from './TideSection'
import TideSetupCard from './TideSetupCard'
import LandingHero from './LandingHero'
import PaywallModal from './PaywallModal'
import AuthButton from './AuthButton'

type Units = { temp: 'c' | 'f'; height: 'ft' | 'm' }
type TideResult = TideReport | TideUnavailable

const FREE_LIMIT = 7
const LS_KEY = 'gs_usage'

function getLocalCount(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) ?? '0', 10) || 0 } catch { return 0 }
}
function incLocalCount() {
  try { localStorage.setItem(LS_KEY, String(getLocalCount() + 1)) } catch {}
}

export default function SurfApp() {
  const { isSignedIn } = useUser()
  const [report, setReport] = useState<SurfReport | null>(null)
  const [tideData, setTideData] = useState<TideResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<Units>({ temp: 'f', height: 'ft' })
  const [showPaywall, setShowPaywall] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [usageCount, setUsageCount] = useState(0)

  // Load usage status on mount / auth change
  useEffect(() => {
    async function loadUsage() {
      try {
        const res = await fetch('/api/usage')
        const data = await res.json()
        if (data.authenticated) {
          setSubscribed(data.subscribed)
          setUsageCount(data.count)
        } else {
          setUsageCount(getLocalCount())
        }
      } catch {
        setUsageCount(getLocalCount())
      }
    }
    loadUsage()
  }, [isSignedIn])

  // Check for ?subscribed=true after Stripe redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      setSubscribed(true)
      window.history.replaceState({}, '', '/')
    }
    if (params.get('paywall') === '1') {
      setShowPaywall(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  async function incrementUsage() {
    if (isSignedIn) {
      const res = await fetch('/api/usage', { method: 'POST' })
      const data = await res.json()
      if (!data.subscribed) setUsageCount(data.count ?? 0)
    } else {
      incLocalCount()
      setUsageCount(getLocalCount())
    }
  }

  const fetchReport = useCallback(async (result: GeoResult) => {
    // Gate check
    if (!subscribed && usageCount >= FREE_LIMIT) {
      setShowPaywall(true)
      return
    }

    setLoading(true)
    setError(null)
    setTideData(null)
    try {
      const qs = new URLSearchParams({
        lat: result.lat.toString(),
        lon: result.lon.toString(),
        name: result.name,
        country: result.country,
      })

      const [surfRes, tideRes] = await Promise.all([
        fetch(`/api/surf?${qs}`),
        fetch(`/api/tides?lat=${result.lat}&lon=${result.lon}`),
      ])

      if (!surfRes.ok) throw new Error('Failed to fetch surf data')

      const [surfJson, tideJson]: [SurfReport, TideResult] = await Promise.all([
        surfRes.json(),
        tideRes.json(),
      ])

      setReport(surfJson)
      setTideData(tideJson)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Count the successful search
      await incrementUsage()

      // Show paywall after this search if now at limit
      const newCount = usageCount + 1
      if (!subscribed && newCount >= FREE_LIMIT) {
        setTimeout(() => setShowPaywall(true), 2000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribed, usageCount])

  async function openBillingPortal() {
    const res = await fetch('/api/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const toggleTemp   = () => setUnits(u => ({ ...u, temp:   u.temp   === 'f' ? 'c'  : 'f'  }))
  const toggleHeight = () => setUnits(u => ({ ...u, height: u.height === 'ft' ? 'm' : 'ft' }))

  const tideHeights: number[] | undefined =
    tideData?.available
      ? (tideData as TideReport).hourly.slice(0, 48).map(h => h.height)
      : undefined

  const usageLeft = Math.max(0, FREE_LIMIT - usageCount)

  return (
    <div className="min-h-screen bg-ocean-gradient">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ocean-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
              Groundswell
            </span>
          </div>
          <div className="flex-1 max-w-xl">
            <SearchBar onSelect={fetchReport} loading={loading} compact />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {report && (
              <>
                <UnitToggle label={units.height.toUpperCase()} onClick={toggleHeight} />
                <UnitToggle label={`°${units.temp.toUpperCase()}`} onClick={toggleTemp} />
              </>
            )}
            {/* Free usage pill — only shown when not subscribed and not full */}
            {!subscribed && usageCount < FREE_LIMIT && usageCount > 0 && (
              <button
                onClick={() => setShowPaywall(true)}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {usageLeft} free {usageLeft === 1 ? 'search' : 'searches'} left
              </button>
            )}
            <AuthButton subscribed={subscribed} onManageBilling={openBillingPortal} />
          </div>
        </div>
      </header>

      <main>
        {!report && !loading && !error && (
          <LandingHero onSelect={fetchReport} />
        )}

        {loading && <LoadingSkeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
            <div className="text-4xl">🌊</div>
            <p className="text-slate-300 text-center max-w-xs">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm hover:bg-sky-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {report && !loading && (
          <div className="mx-auto max-w-6xl px-4 pb-16 space-y-5 pt-5">
            {!report.isCoastal && (
              <div className="glass-card rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5">
                <p className="text-amber-300 text-sm">
                  <span className="font-semibold">Inland location</span> — showing weather data only.
                </p>
              </div>
            )}

            <HeroSection report={report} units={units} />

            {report.isCoastal && <ConditionCards report={report} units={units} />}

            {report.isCoastal && report.hourly.length > 0 && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  48-Hour Wave Outlook
                  {tideHeights && <span className="ml-2 text-teal-400 normal-case font-normal">· with tides</span>}
                </h2>
                <WaveChart
                  hourly={report.hourly}
                  heightUnit={units.height}
                  tideHeights={tideHeights}
                />
              </section>
            )}

            {report.isCoastal && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Tides
                </h2>
                {tideData?.available ? (
                  <TideSection
                    extremes={(tideData as TideReport).extremes}
                    hourly={(tideData as TideReport).hourly}
                    heightUnit={units.height}
                    source={(tideData as TideReport).source}
                    estimated={(tideData as TideReport).estimated}
                    timeFormat={(tideData as TideReport).timeFormat}
                    stationName={(tideData as TideReport).stationName}
                    stationDistanceKm={(tideData as TideReport).stationDistanceKm}
                  />
                ) : (
                  <TideSetupCard reason={(tideData as TideUnavailable | null)?.reason} />
                )}
              </section>
            )}

            <section className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                10-Day Forecast
              </h2>
              <ForecastGrid forecast={report.forecast} units={units} isCoastal={report.isCoastal} />
            </section>

            <footer className="text-center text-xs text-slate-600 pt-4">
              Waves: Open-Meteo Marine & Weather API
              {tideData?.available && ' · Tides: NOAA CO-OPS'}
              {' '}· Updated {new Date(report.updatedAt).toLocaleTimeString()}
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

function WaveLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="rgba(14,165,233,0.15)" />
      <path d="M4 17 C7 13, 10 20, 14 16 C18 12, 21 19, 24 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 20 C7 16, 10 23, 14 19 C18 15, 21 22, 24 18" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  )
}

function UnitToggle({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-md text-xs font-mono font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
    >
      {label}
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 space-y-5 pt-5 animate-pulse">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="h-5 bg-white/5 rounded w-40 mb-6" />
        <div className="flex gap-4 items-end">
          <div className="h-20 bg-white/5 rounded w-32" />
          <div className="h-6 bg-white/5 rounded w-24" />
        </div>
        <div className="flex gap-3 mt-6">
          {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded w-20" />)}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="glass-card rounded-2xl h-36" />)}
      </div>
      <div className="glass-card rounded-2xl h-52" />
      <div className="glass-card rounded-2xl h-72" />
      <div className="glass-card rounded-2xl h-64" />
    </div>
  )
}

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
import ClimatologySection from './ClimatologySection'
import LandingHero from './LandingHero'
import AuthButton from './AuthButton'
import ThemePicker from './ThemePicker'
import type { ClimatologyMonth } from './ClimatologySection'

type Units = { temp: 'c' | 'f'; height: 'ft' | 'm' }
type TideResult = TideReport | TideUnavailable

interface ClimatologyData {
  available: boolean
  months: ClimatologyMonth[]
  peakMonths: number[]
}

function formatHistDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function SurfApp() {
  const { isSignedIn } = useUser()
  const [report, setReport] = useState<SurfReport | null>(null)
  const [tideData, setTideData] = useState<TideResult | null>(null)
  const [climData, setClimData] = useState<ClimatologyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<Units>({ temp: 'f', height: 'ft' })
  const [lastGeoResult, setLastGeoResult] = useState<GeoResult | null>(null)
  const [histDateInput, setHistDateInput] = useState('')

  // Handle ?subscribed=true redirect from Stripe (page.tsx handles the real gate,
  // this just clears the param after a successful round-trip)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const fetchReport = useCallback(async (result: GeoResult) => {
    setLoading(true)
    setError(null)
    setTideData(null)
    setClimData(null)
    setLastGeoResult(result)
    setHistDateInput('')
    try {
      const qs = new URLSearchParams({
        lat: result.lat.toString(),
        lon: result.lon.toString(),
        name: result.name,
        country: result.country,
      })

      const surfRes = await fetch(`/api/surf?${qs}`)
      if (!surfRes.ok) throw new Error('Failed to fetch surf data')
      const surfJson: SurfReport = await surfRes.json()

      const tideParams = `lat=${result.lat}&lon=${result.lon}` +
        (surfJson.timezone ? `&tz=${encodeURIComponent(surfJson.timezone)}` : '')

      // Fetch tides and climatology in parallel — neither blocks the other
      const [tideRes, climRes] = await Promise.all([
        fetch(`/api/tides?${tideParams}`),
        surfJson.isCoastal
          ? fetch(`/api/climatology?lat=${result.lat}&lon=${result.lon}`)
          : Promise.resolve(null),
      ])

      const tideJson: TideResult = await tideRes.json()
      const climJson: ClimatologyData | null = climRes ? await climRes.json() : null

      setReport(surfJson)
      setTideData(tideJson)
      setClimData(climJson)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistorical = useCallback(async (date: string) => {
    if (!lastGeoResult) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        lat: lastGeoResult.lat.toString(),
        lon: lastGeoResult.lon.toString(),
        name: lastGeoResult.name,
        country: lastGeoResult.country,
        date,
      })
      const res = await fetch(`/api/surf-history?${qs}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch historical data')
      setReport(json as SurfReport)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [lastGeoResult])

  async function openBillingPortal() {
    const res = await fetch('/api/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const toggleTemp   = () => setUnits(u => ({ ...u, temp:   u.temp   === 'f' ? 'c'  : 'f'  }))
  const toggleHeight = () => setUnits(u => ({ ...u, height: u.height === 'ft' ? 'm' : 'ft' }))

  return (
    <div className="theme-bg">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 theme-header">
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
            <ThemePicker />
            <AuthButton subscribed={true} onManageBilling={openBillingPortal} />
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

            {/* Historical mode banner */}
            {report.historical && report.historicalDate && (
              <div className="glass-card rounded-xl px-4 py-3 border border-violet-500/25 bg-violet-500/8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  <span className="text-sm text-violet-300 truncate">
                    <span className="font-semibold">Historical conditions</span>
                    <span className="text-violet-400/70 ml-1 hidden sm:inline">·</span>
                    <span className="text-violet-400 ml-1 hidden sm:inline">{formatHistDate(report.historicalDate)}</span>
                    <span className="text-violet-400 ml-1 sm:hidden">{report.historicalDate}</span>
                  </span>
                </div>
                <button
                  onClick={() => lastGeoResult && fetchReport(lastGeoResult)}
                  className="shrink-0 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-200 transition-colors border border-violet-500/30 hover:border-violet-400/50 rounded-lg px-2.5 py-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Live forecast
                </button>
              </div>
            )}

            {!report.isCoastal && (
              <div className="glass-card rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5">
                <p className="text-amber-300 text-sm">
                  <span className="font-semibold">Inland location</span> — showing weather data only.
                </p>
              </div>
            )}

            <HeroSection report={report} units={units} />

            {/* Past conditions date picker (live mode only) */}
            {!report.historical && lastGeoResult && (
              <PastConditionsPicker
                onSubmit={fetchHistorical}
                value={histDateInput}
                onChange={setHistDateInput}
                loading={loading}
              />
            )}

            {report.isCoastal && <ConditionCards report={report} units={units} />}

            {report.isCoastal && report.hourly.length > 0 && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  {report.historical ? 'Hourly Wave Conditions' : '48-Hour Wave Outlook'}
                </h2>
                <WaveChart
                  hourly={report.hourly}
                  heightUnit={units.height}
                />
              </section>
            )}

            <section className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                {report.historical ? 'Day Summary' : '10-Day Forecast'}
              </h2>
              <ForecastGrid forecast={report.forecast} units={units} isCoastal={report.isCoastal} />
            </section>

            {/* Tides: live mode only */}
            {report.isCoastal && !report.historical && (
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
                    timezoneLabel={(tideData as TideReport).timezoneLabel}
                    qualityWarning={(tideData as TideReport).qualityWarning}
                  />
                ) : (
                  <TideSetupCard reason={(tideData as TideUnavailable | null)?.reason} />
                )}
              </section>
            )}

            {report.isCoastal && climData?.available && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Surf Climatology
                </h2>
                <ClimatologySection
                  months={climData.months}
                  peakMonths={climData.peakMonths}
                />
              </section>
            )}

            <footer className="text-center text-xs text-slate-600 pt-4 space-y-1.5">
              <p>
                {report.historical
                  ? `Historical data: Open-Meteo Archive · ${report.historicalDate}`
                  : <>
                      Waves: Open-Meteo Marine &amp; Weather API
                      {tideData?.available && ' · Tides: NOAA CO-OPS'}
                      {' '}· Updated {new Date(report.updatedAt).toLocaleTimeString()}
                    </>
                }
              </p>
              <p>
                <a href="/accuracy" className="hover:text-slate-400 transition-colors underline underline-offset-2">
                  Forecast accuracy &amp; verification →
                </a>
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

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

function PastConditionsPicker({
  onSubmit, value, onChange, loading,
}: {
  onSubmit: (date: string) => void
  value: string
  onChange: (v: string) => void
  loading: boolean
}) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const maxDate = yesterday.toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value) onSubmit(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap border border-white/5"
    >
      <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
      <span className="text-xs text-slate-500 shrink-0">Past conditions</span>
      <input
        type="date"
        value={value}
        min="2022-01-01"
        max={maxDate}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 [color-scheme:dark] focus:outline-none focus:border-sky-500/50 transition-colors"
      />
      <button
        type="submit"
        disabled={!value || loading}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 hover:text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Look up
      </button>
    </form>
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


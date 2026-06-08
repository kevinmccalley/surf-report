'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Menu, X, Lock } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { Tier } from '@/app/page'
import type { SurfReport, TideReport, TideUnavailable, GeoResult, BuoyReading, NearbySpot, SavedLocation } from '@/app/lib/types'
import dynamic from 'next/dynamic'
import SearchBar from './SearchBar'
import LandingHero from './LandingHero'
import AuthButton from './AuthButton'
import ThemePicker from './ThemePicker'
import LanguageSwitcher from './LanguageSwitcher'
import SavedLocations from './SavedLocations'
import type { ClimatologyMonth } from './ClimatologySection'

// Lazy-load below-fold marketing section and everything only needed after a surf spot is searched
const MarketingLanding = dynamic(() => import('./MarketingLanding'))
const HeroSection = dynamic(() => import('./HeroSection'))
const ConditionCards = dynamic(() => import('./ConditionCards'))
const WaveChart = dynamic(() => import('./WaveChart'))
const ForecastGrid = dynamic(() => import('./ForecastGrid'))
const ForecastTimeline = dynamic(() => import('./ForecastTimeline'))
const TideSection = dynamic(() => import('./TideSection'))
const TideSetupCard = dynamic(() => import('./TideSetupCard'))
const ClimatologySection = dynamic(() => import('./ClimatologySection'))
const LastYearCard = dynamic(() => import('./LastYearCard'))
const BuoyCard = dynamic(() => import('./BuoyCard'))
const MapPanel = dynamic(() => import('./MapPanel'))
const NearbySpots = dynamic(() => import('./NearbySpots'))
const EpicNowSection = dynamic(() => import('./EpicNowSection'))
const ModelComparison = dynamic(() => import('./ModelComparison'))
const SessionPlanner = dynamic(() => import('./SessionPlanner'))
const PaywallModal = dynamic(() => import('./PaywallModal'))
import { useLanguage } from '@/app/i18n/LanguageContext'

type Units = { temp: 'c' | 'f'; height: 'ft' | 'm' }
type TideResult = TideReport | TideUnavailable

interface ClimatologyData {
  available: boolean
  months: ClimatologyMonth[]
  peakMonths: number[]
}

export default function SurfApp({ tier, initialGeo }: { tier: Tier; initialGeo?: GeoResult }) {
  const { t, bcp47 } = useLanguage()
  const { isSignedIn, user, isLoaded: clerkLoaded } = useUser()
  const { openSignIn } = useClerk()
  const isSignedInRef = useRef(false)
  const initialGeoFetched = useRef(false)
  useEffect(() => { isSignedInRef.current = !!isSignedIn }, [isSignedIn])
  const isPaid = tier !== 'free'
  const isPremium = tier === 'premium'
  const savedLocations = (user?.publicMetadata?.savedLocations as SavedLocation[] | undefined) ?? []
  const [swellAlertOptIn, setSwellAlertOptIn] = useState<boolean>(
    (user?.publicMetadata?.swellAlertOptIn as boolean | undefined) ?? true
  )
  const [showPaywall, setShowPaywall] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [report, setReport] = useState<SurfReport | null>(null)
  const [tideData, setTideData] = useState<TideResult | null>(null)
  const [climData, setClimData] = useState<ClimatologyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<Units>({ temp: 'f', height: 'ft' })
  const [lastGeoResult, setLastGeoResult] = useState<GeoResult | null>(null)
  const [histDateInput, setHistDateInput] = useState('')
  const [lastYearReport, setLastYearReport] = useState<SurfReport | null>(null)
  const [buoyData, setBuoyData] = useState<(BuoyReading & { waveDirectionLabel?: string | null; windDirectionLabel?: string | null }) | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastGeoResult) {
      const location = lastGeoResult.country
        ? `${lastGeoResult.name}, ${lastGeoResult.country}`
        : lastGeoResult.name
      document.title = `${location} — ${t('meta.surfForecast')} — Groundswell`
    } else {
      document.title = `Groundswell — ${t('meta.tagline')}`
    }
  }, [lastGeoResult, t])

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    if (params.get('subscribed') === 'true') {
      window.history.replaceState({}, '', '/')
      if (!isPaid) {
        fetch('/api/sync-subscription')
          .then(r => r.json())
          .then(data => { if (data.tier !== 'free') window.location.reload() })
          .catch(() => {})
      }
      return
    }

    const lat = parseFloat(params.get('lat') ?? '')
    const lon = parseFloat(params.get('lon') ?? '')

    if (!isNaN(lat) && !isNaN(lon)) {
      const name = params.get('name') ?? 'Location'
      const country = params.get('country') ?? ''
      const geo: GeoResult = { lat, lon, name, country, displayName: `${name}, ${country}` }
      const date = params.get('date') ?? ''
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && isPaid) {
        fetchHistorical(date, geo)
      } else {
        fetchReport(geo, false)
      }
      return
    }

    // No URL params — initialGeo (from /spots/* pages) is handled by the
    // clerkLoaded effect below, which waits until auth state is known.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // For /spots/[slug] pages: wait until Clerk has determined auth state, then
  // auto-load the report. The mount effect runs before Clerk is ready, so we
  // handle initialGeo here instead to ensure isSignedInRef is accurate first.
  useEffect(() => {
    if (!initialGeo || initialGeoFetched.current || lastGeoResult) return
    if (!clerkLoaded) return
    initialGeoFetched.current = true
    fetchReport(initialGeo, false)
  }, [clerkLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // After sign-in, navigate to any location the user was searching for
  useEffect(() => {
    if (!isSignedIn) return
    const pending = sessionStorage.getItem('postSignInUrl')
    if (!pending) return
    sessionStorage.removeItem('postSignInUrl')
    const p = new URLSearchParams(pending.split('?')[1] ?? '')
    const lat = parseFloat(p.get('lat') ?? '')
    const lon = parseFloat(p.get('lon') ?? '')
    const name = p.get('name') ?? ''
    const country = p.get('country') ?? ''
    if (!isNaN(lat) && !isNaN(lon) && name) {
      fetchReport({ lat, lon, name, country, displayName: `${name}, ${country}` })
    }
  }, [isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = useCallback(async (result: GeoResult, updateUrl = true) => {
    setLoading(true)
    setError(null)
    setTideData(null)
    setClimData(null)
    setLastYearReport(null)
    setBuoyData(null)
    setNearbySpots([])
    setNearbyLoading(false)
    setLastGeoResult(result)
    setHistDateInput('')
    if (updateUrl) {
      const url = `/?lat=${result.lat}&lon=${result.lon}&name=${encodeURIComponent(result.name)}&country=${encodeURIComponent(result.country)}`
      window.history.replaceState({}, '', url)
    }
    try {
      const qs = new URLSearchParams({
        lat: result.lat.toString(),
        lon: result.lon.toString(),
        name: result.name,
        country: result.country,
        tier,
      })

      const surfRes = await fetch(`/api/surf?${qs}`)
      if (!surfRes.ok) {
        const errData = await surfRes.json().catch(() => null)
        throw new Error(errData?.error ?? 'Failed to fetch surf data')
      }
      const surfJson: SurfReport = await surfRes.json()

      const tideParams = `lat=${result.lat}&lon=${result.lon}` +
        (surfJson.timezone ? `&tz=${encodeURIComponent(surfJson.timezone)}` : '')

      const [tideRes, climRes, buoyRes] = await Promise.all([
        fetch(`/api/tides?${tideParams}`),
        surfJson.isCoastal
          ? fetch(`/api/climatology?lat=${result.lat}&lon=${result.lon}`)
          : Promise.resolve(null),
        surfJson.isCoastal
          ? fetch(`/api/buoy?lat=${result.lat}&lon=${result.lon}`)
          : Promise.resolve(null),
      ])

      const tideJson: TideResult = await tideRes.json()
      const climJson: ClimatologyData | null = climRes ? await climRes.json() : null
      const buoyJson = buoyRes?.ok ? await buoyRes.json() : null

      setReport(surfJson)
      setTideData(tideJson)
      setClimData(climJson)
      setBuoyData(buoyJson?.waveHeight !== undefined ? buoyJson : null)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Non-blocking: fetch nearby surf spots after main data is shown
      if (surfJson.isCoastal) {
        setNearbyLoading(true)
        fetch(`/api/nearby?lat=${result.lat}&lon=${result.lon}`)
          .then(r => r.ok ? r.json() : [])
          .then((spots: NearbySpot[]) => { setNearbySpots(spots); setNearbyLoading(false) })
          .catch(() => setNearbyLoading(false))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistorical = useCallback(async (date: string, geoOverride?: GeoResult) => {
    const geo = geoOverride ?? lastGeoResult
    if (!geo) return
    if (geoOverride) setLastGeoResult(geoOverride)
    setLoading(true)
    setError(null)
    const url = `/?lat=${geo.lat}&lon=${geo.lon}&name=${encodeURIComponent(geo.name)}&country=${encodeURIComponent(geo.country)}&date=${date}`
    window.history.replaceState({}, '', url)
    try {
      const qs = new URLSearchParams({
        lat: geo.lat.toString(),
        lon: geo.lon.toString(),
        name: geo.name,
        country: geo.country,
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

  useEffect(() => {
    if (!isPaid || !report || report.historical || !report.isCoastal || !lastGeoResult) {
      setLastYearReport(null)
      return
    }
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    const date = d.toISOString().slice(0, 10)
    const qs = new URLSearchParams({
      lat: lastGeoResult.lat.toString(),
      lon: lastGeoResult.lon.toString(),
      name: lastGeoResult.name,
      country: lastGeoResult.country,
      date,
    })
    fetch(`/api/surf-history?${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then((json: SurfReport | null) => {
        if (json?.isCoastal) setLastYearReport(json)
      })
      .catch(() => {})
  }, [report, lastGeoResult])

  async function handleToggleSwellAlert() {
    const next = !swellAlertOptIn
    setSwellAlertOptIn(next)
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swellAlertOptIn: next }),
    }).catch(() => setSwellAlertOptIn(!next))
  }

  async function openBillingPortal() {
    setBillingError(null)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setBillingError(data.error ?? 'Could not open billing portal. Please try again.')
        setTimeout(() => setBillingError(null), 5000)
      }
    } catch {
      setBillingError('Network error. Please try again.')
      setTimeout(() => setBillingError(null), 5000)
    }
  }

  const isSaved = report
    ? savedLocations.some(s => Math.abs(s.lat - report.location.lat) < 0.001 && Math.abs(s.lon - report.location.lon) < 0.001)
    : false

  async function handleToggleSave() {
    if (!isSignedIn) { openSignIn(); return }
    if (!report) return
    if (isSaved) {
      await fetch('/api/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: report.location.lat, lon: report.location.lon }),
      })
    } else {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: report.location.name,
          country: report.location.country,
          displayName: report.location.country
            ? `${report.location.name}, ${report.location.country}`
            : report.location.name,
          lat: report.location.lat,
          lon: report.location.lon,
        }),
      })
      if (res.status === 403) { setShowPaywall(true); return }
    }
    await user?.reload()
  }

  async function handleRemoveLocation(lat: number, lon: number) {
    await fetch('/api/locations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    })
    await user?.reload()
  }

  async function handleSetAlert(lat: number, lon: number, thresholdM: number | null) {
    await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, alertThreshold: thresholdM }),
    })
    await user?.reload()
  }

  const toggleTemp   = () => setUnits(u => ({ ...u, temp:   u.temp   === 'f' ? 'c'  : 'f'  }))
  const toggleHeight = () => setUnits(u => ({ ...u, height: u.height === 'ft' ? 'm' : 'ft' }))

  const formatHistDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString(bcp47, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="theme-bg">
      <header className="sticky top-0 z-50 theme-header" ref={menuRef}>
        <div className="px-4 py-3 flex items-center gap-3">
          <a href="/" aria-label="Groundswell home" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <WaveLogo />
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
              Groundswell
            </span>
          </a>
          <div className="flex-1 sm:max-w-xl">
            <SearchBar onSelect={fetchReport} loading={loading} compact />
          </div>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-auto">
            {report && (
              <>
                <UnitToggle label={units.height.toUpperCase()} onClick={toggleHeight} />
                <UnitToggle label={`°${units.temp.toUpperCase()}`} onClick={toggleTemp} />
              </>
            )}
            <LanguageSwitcher />
            <ThemePicker />
            {isSignedIn && (
              <SavedLocations
                locations={savedLocations}
                heightUnit={units.height}
                onSelect={(loc) => fetchReport({ name: loc.name, country: loc.country, lat: loc.lat, lon: loc.lon, displayName: loc.displayName })}
                onRemove={handleRemoveLocation}
                onSetAlert={handleSetAlert}
              />
            )}
            <AuthButton subscribed={isPaid} isPremium={isPremium} swellAlertOptIn={swellAlertOptIn} onManageBilling={openBillingPortal} onToggleSwellAlert={handleToggleSwellAlert} />
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            onClick={() => setShowMenu(m => !m)}
            aria-label="Menu"
          >
            {showMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {showMenu && (
          <div className="sm:hidden border-t border-white/5 px-4 py-2.5 flex items-center gap-1 flex-wrap">
            {report && (
              <>
                <UnitToggle label={units.height.toUpperCase()} onClick={toggleHeight} />
                <UnitToggle label={`°${units.temp.toUpperCase()}`} onClick={toggleTemp} />
              </>
            )}
            <LanguageSwitcher align="left" />
            <ThemePicker align="left" />
            {isSignedIn && (
              <SavedLocations
                locations={savedLocations}
                heightUnit={units.height}
                onSelect={(loc) => { fetchReport({ name: loc.name, country: loc.country, lat: loc.lat, lon: loc.lon, displayName: loc.displayName }); setShowMenu(false) }}
                onRemove={handleRemoveLocation}
                onSetAlert={handleSetAlert}
              />
            )}
            <AuthButton subscribed={isPaid} isPremium={isPremium} swellAlertOptIn={swellAlertOptIn} onManageBilling={openBillingPortal} onToggleSwellAlert={handleToggleSwellAlert} />
          </div>
        )}
      </header>

      {billingError && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-red-500/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm">
          {billingError}
        </div>
      )}

      <main id="main-content">
        {!report && !loading && !error && (
          isSignedIn
            ? <LandingHero onSelect={fetchReport} />
            : <MarketingLanding onSearch={fetchReport} />
        )}

        {isPaid && isSignedIn && !report && !loading && !error && (
          <EpicNowSection units={units} onSelect={fetchReport} />
        )}
        {!isPaid && isSignedIn && !report && !loading && !error && (
          <UpgradeTeaser onUpgrade={() => setShowPaywall(true)} />
        )}

        {!report && !loading && !error && (
          <footer className="text-center text-xs text-slate-600 pb-8 pt-4">
            <SiteFooterLinks />
          </footer>
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
              {t('app.tryAgain')}
            </button>
          </div>
        )}

        {report && !loading && (
          <div className="mx-auto max-w-6xl px-4 pb-16 space-y-5 pt-5">

            {report.historical && report.historicalDate && (
              <div className="glass-card rounded-xl px-4 py-3 border border-violet-500/25 bg-violet-500/8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  <span className="text-sm text-violet-300 truncate">
                    <span className="font-semibold">{t('app.historicalBanner')}</span>
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
                  {t('app.liveForecast')}
                </button>
              </div>
            )}

            {!report.isCoastal && (
              <div className="glass-card rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5">
                <p className="text-amber-300 text-sm">
                  <span className="font-semibold">{t('app.inlandLocation')}</span> — {t('app.inlandDesc')}
                </p>
              </div>
            )}

            <HeroSection
              report={report}
              units={units}
              onMapOpen={() => setShowMap(true)}
              isSaved={isSaved}
              onToggleSave={handleToggleSave}
              buoy={buoyData}
            />

            {report.isCoastal && <ConditionCards report={report} units={units} />}

            {report.isCoastal && !report.historical && buoyData && (
              <BuoyCard
                buoy={buoyData}
                modelWaveHeight={report.current.waveHeight}
                units={units}
              />
            )}

            {report.isCoastal && report.hourly.length > 0 && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  {report.historical ? t('app.hourlyWave') : t('app.48hOutlook')}
                </h2>
                <WaveChart hourly={report.hourly} heightUnit={units.height} />
              </section>
            )}

            {!report.historical && report.isCoastal && report.hourly.length > 0 && (
              <ForecastTimeline
                forecast={report.forecast}
                hourly={report.hourly}
                units={units}
                tideHourly={tideData?.available ? (tideData as import('@/app/lib/types').TideReport).hourly : undefined}
                tier={tier}
                onUpgrade={() => setShowPaywall(true)}
                activeDate={activeDate}
                onDateSelect={setActiveDate}
              />
            )}

            <section className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                {report.historical ? t('app.daySummary') : isPremium ? t('app.16dayForecast') : t('app.10dayForecast')}
              </h2>
              <ForecastGrid forecast={report.forecast} units={units} isCoastal={report.isCoastal} isPremium={isPremium} activeDate={activeDate} onDateSelect={setActiveDate} />
              {!isPaid && !report.historical && report.isCoastal && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="mt-4 w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-teal-500/20 bg-teal-500/6 hover:bg-teal-500/10 transition-colors text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-teal-300">{t('forecast.upgradeCtaTitle')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('forecast.upgradeCtaDesc')}</p>
                    <p className="text-xs text-teal-400/60 mt-1">{t('paywall.priceContrast')}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-teal-400/60 group-hover:text-teal-300 transition-colors ml-3">
                    <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </section>

            {report.isCoastal && !report.historical && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  {t('app.tides')}
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
                    observedOffset={(tideData as TideReport).observedOffset}
                    observedAt={(tideData as TideReport).observedAt}
                    tier={tier}
                    onUpgrade={() => setShowPaywall(true)}
                  />
                ) : (
                  <TideSetupCard reason={(tideData as TideUnavailable | null)?.reason} />
                )}
              </section>
            )}

            {report.isCoastal && (
              <NearbySpots
                spots={nearbySpots}
                loading={nearbyLoading}
                units={units}
                onSelect={(spot) => fetchReport({
                  lat: spot.lat, lon: spot.lon,
                  name: spot.name, country: '',
                  displayName: spot.name,
                })}
              />
            )}

            {report.isCoastal && climData?.available && (
              <section className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  {t('app.climatology')}
                </h2>
                <ClimatologySection
                  months={climData.months}
                  peakMonths={climData.peakMonths}
                />
              </section>
            )}

            {!report.historical && lastGeoResult && isPaid && (
              <PastConditionsPicker
                onSubmit={fetchHistorical}
                value={histDateInput}
                onChange={setHistDateInput}
                loading={loading}
                label={t('app.pastConditions')}
                lookUpLabel={t('app.lookUp')}
              />
            )}

            {!report.historical && lastGeoResult && !isPaid && (
              <HistoricalGate onUpgrade={() => setShowPaywall(true)} />
            )}

            {report.isCoastal && !report.historical && lastYearReport && isPaid && (
              <LastYearCard
                report={lastYearReport}
                units={units}
                onViewFull={fetchHistorical}
              />
            )}

            {isPremium && !report.historical && report.isCoastal && (
              <ModelComparison
                lat={report.location.lat}
                lon={report.location.lon}
                units={units}
              />
            )}

            {isPremium && !report.historical && report.isCoastal && (
              <SessionPlanner
                hourly={report.hourly}
                tideData={tideData?.available ? tideData : null}
                units={units}
              />
            )}

            {isPaid && !isPremium && !report.historical && (
              <PremiumTeaser />
            )}

            <footer className="text-center text-xs text-slate-400 pt-4 space-y-1.5">
              <p>
                {report.historical
                  ? t('app.historicalSource', { date: report.historicalDate ?? '' })
                  : <>
                      {t('app.waveSource')}
                      {tideData?.available && t('app.tidesSource')}
                      {t('app.updatedAt', { time: new Date(report.updatedAt).toLocaleTimeString(bcp47) })}
                    </>
                }
              </p>
              <p>
                <a href="/accuracy" className="hover:text-slate-300 transition-colors underline underline-offset-2">
                  {t('app.forecastAccuracy')}
                </a>
              </p>
              <SiteFooterLinks />
            </footer>
          </div>
        )}
      </main>

      {report && showMap && (
        <MapPanel
          report={report}
          units={units}
          onClose={() => setShowMap(false)}
          nearbySpots={nearbySpots}
          onSpotSelect={(spot) => {
            fetchReport({
              lat: spot.lat, lon: spot.lon,
              name: spot.name, country: '',
              displayName: spot.name,
            })
          }}
        />
      )}

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
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

function PastConditionsPicker({
  onSubmit, value, onChange, loading, label, lookUpLabel,
}: {
  onSubmit: (date: string) => void
  value: string
  onChange: (v: string) => void
  loading: boolean
  label: string
  lookUpLabel: string
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
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <input
        type="date"
        value={value}
        min="2022-01-01"
        max={maxDate}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
        style={{
          background: 'var(--search-bg)',
          border: '1px solid var(--search-border)',
          color: 'var(--text-base)',
          colorScheme: 'inherit',
        }}
      />
      <button
        type="submit"
        disabled={!value || loading}
        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{
          background: `rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.14)`,
          border: `1px solid rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.35)`,
          color: 'var(--accent-bright)',
        }}
      >
        {lookUpLabel}
      </button>
    </form>
  )
}

function SiteFooterLinks() {
  const { t } = useLanguage()
  return (
    <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
      <a href="/blog"     className="hover:text-slate-300 transition-colors">{t('nav.blog')}</a>
      <a href="/faq"      className="hover:text-slate-300 transition-colors">{t('nav.faq')}</a>
      <a href="/terms"    className="hover:text-slate-300 transition-colors">{t('nav.terms')}</a>
      <a href="/privacy"  className="hover:text-slate-300 transition-colors">{t('nav.privacy')}</a>
      <a href="/refund"   className="hover:text-slate-300 transition-colors">{t('nav.refund')}</a>
      <a href="/support"  className="hover:text-slate-300 transition-colors">{t('nav.support')}</a>
      <a href="/accuracy" className="hover:text-slate-300 transition-colors">{t('nav.accuracy')}</a>
    </nav>
  )
}

function PremiumTeaser() {
  const { t } = useLanguage()
  const features = [
    { key: 'premium.teaser.extended', icon: '📅' },
    { key: 'premium.teaser.models',   icon: '📊' },
    { key: 'premium.teaser.alerts',   icon: '🔔' },
    { key: 'premium.teaser.sessions', icon: '🏄' },
    { key: 'premium.teaser.api',      icon: '⚡' },
  ]
  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6 border border-sky-500/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Premium</p>
          <p className="text-sm font-semibold text-white mt-0.5">{t('premium.teaser.comingSoon')}</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/12 text-sky-400 border border-sky-500/20 font-medium">
          {t('premium.teaser.inDev')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {features.map(f => (
          <div
            key={f.key}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 bg-white/2"
          >
            <span className="text-base opacity-40">{f.icon}</span>
            <span className="text-xs text-slate-500">{t(f.key)}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0 opacity-30">
              <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" stroke="#94a3b8" strokeWidth="1.2" />
              <path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600 mt-3">{t('premium.teaser.footer')}</p>
    </section>
  )
}

function UpgradeTeaser({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useLanguage()
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <button
        onClick={onUpgrade}
        className="w-full glass-card rounded-2xl p-6 border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 transition-colors text-left group"
      >
        <div className="flex items-center gap-3 mb-2">
          <Lock size={16} className="text-sky-400 shrink-0" />
          <span className="text-sm font-semibold text-sky-300">{t('paywall.epicNowTeaser')}</span>
        </div>
        <p className="text-xs text-slate-400 ml-7">{t('paywall.epicNowDesc')}</p>
        <p className="text-xs text-teal-400/70 mt-1.5 ml-7">{t('paywall.priceContrast')}</p>
        <p className="text-xs text-sky-400 mt-2 ml-7 group-hover:text-sky-300 transition-colors">
          {t('paywall.upgradeLink')} →
        </p>
      </button>
    </section>
  )
}

function HistoricalGate({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useLanguage()
  return (
    <button
      onClick={onUpgrade}
      className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5 hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors w-full text-left group"
    >
      <Lock size={14} className="text-slate-500 shrink-0 group-hover:text-sky-400 transition-colors" />
      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
        {t('paywall.historicalGate')}
      </span>
      <span className="ml-auto text-xs text-sky-500 group-hover:text-sky-300 transition-colors shrink-0">
        {t('paywall.upgradeLink')} →
      </span>
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

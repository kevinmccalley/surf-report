'use client'

import type { GeoResult } from '@/app/lib/types'
import SearchBar from './SearchBar'

const FEATURED = [
  { name: 'Pipeline', country: 'Hawaii, USA', lat: 21.6632, lon: -158.0523 },
  { name: 'Jeffreys Bay', country: 'South Africa', lat: -34.0481, lon: 24.9313 },
  { name: 'Hossegor', country: 'France', lat: 43.6632, lon: -1.4365 },
  { name: 'Uluwatu', country: 'Bali, Indonesia', lat: -8.8292, lon: 115.0849 },
  { name: 'Mavericks', country: 'California, USA', lat: 37.4931, lon: -122.5007 },
  { name: 'Snapper Rocks', country: 'Queensland, AU', lat: -28.1575, lon: 153.5538 },
]

export default function LandingHero({ onSelect }: { onSelect: (r: GeoResult) => void }) {
  return (
    <div className="relative min-h-[calc(100vh-57px)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl" />
      </div>

      {/* Animated wave */}
      <WaveBackground />

      <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto">
        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Live data · Any beach on earth
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="text-white">Know</span>{' '}
          <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
            before
          </span>{' '}
          <span className="text-white">you go.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Real-time surf reports and 10-day forecasts for any spot in the world.
        </p>

        <div className="w-full max-w-lg mx-auto">
          <SearchBar onSelect={onSelect} loading={false} autoFocus />
        </div>

        {/* Featured spots */}
        <div className="mt-10">
          <p className="text-slate-600 text-xs uppercase tracking-widest mb-4">Popular spots</p>
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED.map(spot => (
              <button
                key={spot.name}
                onClick={() => onSelect({
                  name: spot.name,
                  country: spot.country,
                  lat: spot.lat,
                  lon: spot.lon,
                  displayName: `${spot.name}, ${spot.country}`,
                })}
                className="px-3 py-1.5 rounded-full text-sm text-slate-400 hover:text-white border border-white/8 hover:border-sky-500/40 hover:bg-sky-500/8 transition-all duration-200"
              >
                {spot.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WaveBackground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
      <div className="wave-container h-full">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="wave-path-1 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1440,20 1440,60 L1440,120 L0,120 Z"
            fill="rgba(14,165,233,0.04)"
          />
        </svg>
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="wave-path-2 w-full absolute bottom-0"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C200,80 400,10 600,50 C800,90 1000,10 1200,50 C1300,70 1380,30 1440,50 L1440,120 L0,120 Z"
            fill="rgba(56,189,248,0.05)"
          />
        </svg>
      </div>
    </div>
  )
}

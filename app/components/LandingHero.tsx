'use client'

import type { GeoResult } from '@/app/lib/types'
import SearchBar from './SearchBar'
import { useLanguage } from '@/app/i18n/LanguageContext'
import type { Locale } from '@/app/i18n/LanguageContext'

// ── Global classics ───────────────────────────────────────────────────────────

const FEATURED = [
  { name: 'Pipeline',      country: 'Hawaii, USA',           lat:  21.6632, lon: -158.0523 },
  { name: 'Jeffreys Bay',  country: 'South Africa',          lat: -34.0481, lon:   24.9313 },
  { name: 'Hossegor',      country: 'France',                lat:  43.6632, lon:   -1.4365 },
  { name: 'Uluwatu',       country: 'Bali, Indonesia',       lat:  -8.8292, lon:  115.0849 },
  { name: 'Mavericks',     country: 'California, USA',       lat:  37.4931, lon: -122.5007 },
  { name: 'Snapper Rocks', country: 'Queensland, Australia', lat: -28.1575, lon:  153.5538 },
]

// ── Locale-specific spots ─────────────────────────────────────────────────────

type Spot = { name: string; country: string; lat: number; lon: number }

const LOCALE_SPOTS: Record<Locale, Spot[]> = {
  'en': [
    { name: 'Rincon',         country: 'California, USA',       lat:  34.3728, lon: -119.4788 },
    { name: 'Trestles',       country: 'California, USA',       lat:  33.3859, lon: -117.5879 },
    { name: 'Bells Beach',    country: 'Victoria, Australia',   lat: -38.3667, lon:  144.2833 },
    { name: 'Fistral Beach',  country: 'Cornwall, UK',          lat:  50.4145, lon:   -5.0985 },
    { name: 'Bundoran',       country: 'Donegal, Ireland',      lat:  54.4824, lon:   -8.2772 },
    { name: 'Raglan',         country: 'Waikato, New Zealand',  lat: -37.8024, lon:  174.8706 },
  ],
  'es': [
    { name: 'Mundaka',          country: 'País Vasco, España',     lat:  43.4061, lon:   -2.6981 },
    { name: 'Puerto Escondido', country: 'Oaxaca, México',         lat:  15.8647, lon:  -97.0724 },
    { name: 'Chicama',          country: 'La Libertad, Perú',      lat:  -7.8512, lon:  -79.4531 },
    { name: 'Punta de Lobos',   country: 'Pichilemu, Chile',       lat: -34.4266, lon:  -71.9874 },
    { name: 'La Santa',         country: 'Lanzarote, España',      lat:  29.1169, lon:  -13.6617 },
    { name: 'Salinas',          country: 'Asturias, España',       lat:  43.5778, lon:   -5.9628 },
  ],
  'fr': [
    { name: "Teahupo'o",    country: 'Tahiti, Polynésie française', lat: -17.8419, lon: -149.2675 },
    { name: 'Biarritz',     country: 'Pyrénées-Atlantiques, France',lat:  43.4832, lon:   -1.5586 },
    { name: 'Lacanau',      country: 'Gironde, France',             lat:  44.9833, lon:   -1.2167 },
    { name: 'La Torche',    country: 'Finistère, France',           lat:  47.8384, lon:   -4.3233 },
    { name: 'Quiberon',     country: 'Morbihan, France',            lat:  47.4801, lon:   -3.1202 },
    { name: 'Boucan Canot', country: 'La Réunion, France',          lat: -20.9297, lon:   55.3019 },
  ],
  'pt-BR': [
    { name: 'Fernando de Noronha', country: 'Pernambuco, Brasil',       lat:  -3.8589, lon:  -32.4278 },
    { name: 'Saquarema',           country: 'Rio de Janeiro, Brasil',   lat: -22.9195, lon:  -42.5047 },
    { name: 'Itacaré',             country: 'Bahia, Brasil',            lat: -14.2786, lon:  -38.9985 },
    { name: 'Maresias',            country: 'São Paulo, Brasil',        lat: -23.7838, lon:  -45.5621 },
    { name: 'Florianópolis',       country: 'Santa Catarina, Brasil',   lat: -27.5954, lon:  -48.5480 },
    { name: 'Ubatuba',             country: 'São Paulo, Brasil',        lat: -23.4336, lon:  -45.0838 },
  ],
  'pt-PT': [
    { name: 'Nazaré',         country: 'Leiria, Portugal',   lat:  39.6018, lon:  -9.0704 },
    { name: 'Peniche',        country: 'Leiria, Portugal',   lat:  39.3558, lon:  -9.3811 },
    { name: 'Ericeira',       country: 'Lisboa, Portugal',   lat:  38.9622, lon:  -9.4146 },
    { name: 'Sagres',         country: 'Algarve, Portugal',  lat:  36.9815, lon:  -8.9418 },
    { name: 'Jardim do Mar',  country: 'Madeira, Portugal',  lat:  32.7426, lon: -17.2295 },
    { name: 'Ribeira Grande', country: 'Açores, Portugal',   lat:  37.8304, lon: -25.5188 },
  ],
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingHero({ onSelect }: { onSelect: (r: GeoResult) => void }) {
  const { t, locale } = useLanguage()
  const localSpots = LOCALE_SPOTS[locale]

  function toGeoResult(spot: Spot): GeoResult {
    return { name: spot.name, country: spot.country, lat: spot.lat, lon: spot.lon, displayName: `${spot.name}, ${spot.country}` }
  }

  return (
    <div className="relative min-h-[calc(100vh-57px)] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl" />
      </div>

      <WaveBackground />

      <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto">
        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          {t('landing.badge')}
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="text-white">Know</span>{' '}
          <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
            before
          </span>{' '}
          <span className="text-white">you go.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
          {t('landing.subtitle')}
        </p>

        <div className="w-full max-w-lg mx-auto">
          <SearchBar onSelect={onSelect} loading={false} autoFocus />
        </div>

        <div className="mt-10 space-y-5">
          {/* Locale-specific row */}
          <div>
            <p className="text-slate-600 text-xs uppercase tracking-widest mb-3">{t('landing.localSpotsLabel')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {localSpots.map(spot => (
                <button
                  key={spot.name}
                  onClick={() => onSelect(toGeoResult(spot))}
                  className="px-3 py-1.5 rounded-full text-sm text-sky-400/80 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/8 transition-all duration-200"
                >
                  {spot.name}
                </button>
              ))}
            </div>
          </div>

          {/* Thin divider */}
          <div className="border-t border-white/5 mx-8" />

          {/* Global classics row */}
          <div>
            <p className="text-slate-600 text-xs uppercase tracking-widest mb-3">{t('landing.popularSpots')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {FEATURED.map(spot => (
                <button
                  key={spot.name}
                  onClick={() => onSelect(toGeoResult(spot))}
                  className="px-3 py-1.5 rounded-full text-sm text-slate-400 hover:text-white border border-white/8 hover:border-sky-500/40 hover:bg-sky-500/8 transition-all duration-200"
                >
                  {spot.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-700">
          <a href="/accuracy" className="hover:text-slate-500 transition-colors underline underline-offset-2">
            {t('landing.accuracyNote')}
          </a>
        </p>
      </div>
    </div>
  )
}

function WaveBackground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
      <div className="wave-container h-full">
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="wave-path-1 w-full" preserveAspectRatio="none">
          <path d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1440,20 1440,60 L1440,120 L0,120 Z" fill="rgba(14,165,233,0.04)" />
        </svg>
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="wave-path-2 w-full absolute bottom-0" preserveAspectRatio="none">
          <path d="M0,40 C200,80 400,10 600,50 C800,90 1000,10 1200,50 C1300,70 1380,30 1440,50 L1440,120 L0,120 Z" fill="rgba(56,189,248,0.05)" />
        </svg>
      </div>
    </div>
  )
}

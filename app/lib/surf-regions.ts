import { getAllSpots, slugify, type SurfSpot } from './surf-spots'
import type { Continent } from './continents'

// ─────────────────────────────────────────────────────────────────────────────
// SurfRegion — the granular "surf area" concept (Baja Sur, North Shore Oahu,
// Ericeira/Peniche). NOT the same as `Continent` (the 8+1 bucket taxonomy in
// app/lib/continents.ts). See docs/surf-regions-feature-spec.md §3.
//
// This is the static-TS home for region content, per Kevin's decision (spec
// §10) — Sanity was the other option; revisit only if localized per-region
// prose becomes a real content workflow. Region `name`s are proper nouns and
// are NOT translated (same rule as spot names). Only UI chrome goes through t().
//
// `spotSlugs` reference `slugify(SurfSpot.name)` from surf-spots.ts. Keep them
// in sync with that catalog — `getRegionSpots()` silently drops unknown slugs,
// and the test suite asserts every slug resolves.
// ─────────────────────────────────────────────────────────────────────────────

export interface SurfRegion {
  /** URL slug, e.g. 'baja-sur', 'north-shore-oahu'. Unique across all regions. */
  slug: string
  /** Proper-noun display name. Not translated. */
  name: string
  /** Continent bucket (app/lib/continents.ts). */
  continent: Continent
  /** ISO 3166-1 alpha-2 country/territory code, e.g. 'US', 'MX', 'ID', 'PR'. */
  country: string
  /** Optional state / province / prefecture, free-form, e.g. 'CA', 'BCS', 'QLD'. */
  admin?: string
  /** Map focal point. Rough centroid of the member spots. */
  center: { lat: number; lon: number }
  /** Optional curated bounding box override: [[south, west], [north, east]]. */
  bounds?: [[number, number], [number, number]]
  /** References into `slugify(SurfSpot.name)` from surf-spots.ts. */
  spotSlugs: string[]
  /** Extra strings that should resolve to this region in search. */
  searchAliases?: string[]
  /** i18n key for the localized region blurb. Copy deferred — see spec §8. */
  descriptionKey?: string
  /**
   * Fully unlocked on the free tier as a genuine sample (spec §7).
   * Kevin's picks: Central California + Portugal — Ericeira/Peniche.
   */
  flagship?: boolean
}

// ─── The regions ─────────────────────────────────────────────────────────────
// ~55 curated areas, extending the sample list in spec §4. Ordered by
// continent, roughly north-to-south / west-to-east within each.

const SURF_REGIONS: SurfRegion[] = [
  // ── Hawaii ────────────────────────────────────────────────────────────────
  {
    slug: 'north-shore-oahu',
    name: 'North Shore, Oahu',
    continent: 'Hawaii',
    country: 'US',
    admin: 'HI',
    center: { lat: 21.652, lon: -158.06 },
    spotSlugs: ['pipeline', 'backdoor', 'off-the-wall', 'sunset-beach', 'waimea-bay', 'laniakea', 'rocky-point', 'haleiwa'],
    searchAliases: ['North Shore', 'Oahu North Shore', 'Seven Mile Miracle', 'The Country'],
  },
  {
    slug: 'south-shore-oahu',
    name: 'South Shore, Oahu',
    continent: 'Hawaii',
    country: 'US',
    admin: 'HI',
    center: { lat: 21.28, lon: -157.83 },
    // Makaha sits on Oahu's west side; grouped here as the non-North-Shore Oahu bucket for v1.
    spotSlugs: ['waikiki', 'ala-moana-bowls', 'sandy-beach', 'makaha'],
    searchAliases: ['Town', 'Honolulu', 'Waikiki', 'Oahu South Shore'],
  },
  {
    slug: 'maui',
    name: 'Maui',
    continent: 'Hawaii',
    country: 'US',
    admin: 'HI',
    center: { lat: 20.94, lon: -156.42 },
    spotSlugs: ['jaws', 'honolua-bay', 'hookipa'],
    searchAliases: ['Peahi', "Pe'ahi", 'Valley Isle'],
  },
  {
    slug: 'kauai',
    name: 'Kauai',
    continent: 'Hawaii',
    country: 'US',
    admin: 'HI',
    center: { lat: 22.21, lon: -159.51 },
    spotSlugs: ['hanalei-bay'],
    searchAliases: ['Garden Isle', "Kaua'i", 'Hanalei'],
  },

  // ── North America ─────────────────────────────────────────────────────────
  {
    slug: 'southern-california',
    name: 'Southern California',
    continent: 'North America',
    country: 'US',
    admin: 'CA',
    center: { lat: 33.7, lon: -118.05 },
    spotSlugs: [
      'rincon', 'c-street', 'first-point-malibu', 'el-porto', 'huntington-beach', 'salt-creek',
      'lowers', 'uppers', 'san-onofre', 'swamis', 'blacks-beach', 'windansea', 'big-rock',
    ],
    searchAliases: ['SoCal', 'Orange County', 'San Diego', 'Ventura', 'Trestles'],
  },
  {
    slug: 'central-california',
    name: 'Central California',
    continent: 'North America',
    country: 'US',
    admin: 'CA',
    center: { lat: 36.75, lon: -121.9 },
    spotSlugs: ['steamer-lane', 'pleasure-point', 'ghost-tree', 'pismo-beach'],
    searchAliases: ['Central Coast', 'Santa Cruz', 'Monterey', 'Big Sur'],
    flagship: true,
  },
  {
    slug: 'northern-california',
    name: 'Northern California',
    continent: 'North America',
    country: 'US',
    admin: 'CA',
    center: { lat: 37.72, lon: -122.5 },
    spotSlugs: ['mavericks', 'ocean-beach', 'fort-point'],
    searchAliases: ['NorCal', 'San Francisco', 'Bay Area', 'Half Moon Bay'],
  },
  {
    slug: 'florida',
    name: 'Florida',
    continent: 'North America',
    country: 'US',
    admin: 'FL',
    center: { lat: 28.6, lon: -80.62 },
    spotSlugs: ['sebastian-inlet', 'cocoa-beach', 'new-smyrna-beach', 'flagler-beach'],
    searchAliases: ['Space Coast', 'Cocoa Beach', 'East Coast', 'NSB'],
  },
  {
    slug: 'outer-banks',
    name: 'Outer Banks, NC',
    continent: 'North America',
    country: 'US',
    admin: 'NC',
    center: { lat: 35.64, lon: -75.63 },
    spotSlugs: ['cape-hatteras', 'outer-banks'],
    searchAliases: ['OBX', 'Cape Hatteras', 'Hatteras', 'North Carolina'],
  },
  {
    slug: 'south-carolina',
    name: 'South Carolina',
    continent: 'North America',
    country: 'US',
    admin: 'SC',
    center: { lat: 32.66, lon: -79.94 },
    spotSlugs: ['folly-beach'],
    searchAliases: ['Folly Beach', 'Charleston'],
  },
  {
    slug: 'new-jersey-new-york',
    name: 'New Jersey / New York',
    continent: 'North America',
    country: 'US',
    admin: 'NJ',
    center: { lat: 40.55, lon: -73.6 },
    spotSlugs: ['montauk', 'manasquan', 'asbury-park'],
    searchAliases: ['Jersey Shore', 'Long Island', 'New York', 'NYC', 'Ditch Plains'],
  },
  {
    slug: 'new-england',
    name: 'New England',
    continent: 'North America',
    country: 'US',
    admin: 'MA',
    center: { lat: 41.6, lon: -70.0 },
    spotSlugs: ['nantucket', 'nauset-beach'],
    searchAliases: ['Cape Cod', 'Massachusetts', 'Rhode Island'],
  },
  {
    slug: 'british-columbia',
    name: 'Vancouver Island, BC',
    continent: 'North America',
    country: 'CA',
    admin: 'BC',
    center: { lat: 49.12, lon: -125.91 },
    spotSlugs: ['tofino'],
    searchAliases: ['Tofino', 'Vancouver Island', 'Canada', 'Pacific Rim'],
  },

  // ── Latin America ─────────────────────────────────────────────────────────
  {
    slug: 'baja-norte',
    name: 'Baja Norte',
    continent: 'Latin America',
    country: 'MX',
    admin: 'BCN',
    center: { lat: 31.7, lon: -116.75 },
    spotSlugs: ['todos-santos', 'punta-baja', 'san-miguel', 'k38'],
    searchAliases: ['Baja North', 'Northern Baja', 'Ensenada', 'Rosarito', 'Killers'],
  },
  {
    slug: 'baja-sur',
    name: 'Baja Sur',
    continent: 'Latin America',
    country: 'MX',
    admin: 'BCS',
    center: { lat: 26.3, lon: -112.7 },
    spotSlugs: ['scorpion-bay', 'los-cerritos', 'punta-abreojos'],
    searchAliases: ['Baja South', 'Southern Baja', 'San Juanico', 'Todos Santos BCS'],
  },
  {
    slug: 'mainland-mexico-pacific',
    name: 'Mainland Mexico — Pacific',
    continent: 'Latin America',
    country: 'MX',
    center: { lat: 17.5, lon: -100.5 },
    spotSlugs: ['puerto-escondido', 'salina-cruz', 'punta-de-mita', 'pascuales', 'la-ticla', 'la-saladita'],
    searchAliases: ['Puerto Escondido', 'Oaxaca', 'Mexican Pipeline', 'Zicatela', 'Nayarit', 'Troncones'],
  },
  {
    slug: 'costa-rica-pacific',
    name: 'Costa Rica — Pacific',
    continent: 'Latin America',
    country: 'CR',
    center: { lat: 9.9, lon: -85.2 },
    spotSlugs: ['witchs-rock', 'ollies-point', 'pavones', 'playa-hermosa', 'playa-dominical', 'playa-guiones', 'playa-grande'],
    searchAliases: ['Guanacaste', 'Nosara', 'Nicoya', 'Jacó', 'Tamarindo'],
  },
  {
    slug: 'costa-rica-caribbean',
    name: 'Costa Rica — Caribbean',
    continent: 'Latin America',
    country: 'CR',
    center: { lat: 9.66, lon: -82.73 },
    spotSlugs: ['salsa-brava'],
    searchAliases: ['Puerto Viejo', 'Limón', 'Salsa Brava'],
  },
  {
    slug: 'el-salvador',
    name: 'El Salvador',
    continent: 'Latin America',
    country: 'SV',
    center: { lat: 13.4, lon: -88.6 },
    spotSlugs: ['punta-roca', 'las-flores'],
    searchAliases: ['La Libertad', 'Punta Roca', 'Las Flores', 'El Tunco'],
  },
  {
    slug: 'puerto-rico',
    name: 'Puerto Rico',
    continent: 'Latin America',
    country: 'PR',
    center: { lat: 18.35, lon: -67.25 },
    // The catalog's "Rincon" slug resolves to Rincon, CA; PR's Rincón spots are the others here.
    spotSlugs: ['marias-beach', 'gas-chambers', 'wilderness'],
    searchAliases: ['Rincón', 'Rincon PR', 'Tres Palmas', 'Aguadilla'],
  },
  {
    slug: 'peru',
    name: 'Peru',
    continent: 'Latin America',
    country: 'PE',
    center: { lat: -8.0, lon: -79.5 },
    spotSlugs: ['chicama', 'lobitos', 'mancora', 'la-herradura'],
    searchAliases: ['Chicama', 'Máncora', 'Lima', 'Puerto Malabrigo', 'Norte'],
  },
  {
    slug: 'chile',
    name: 'Chile',
    continent: 'Latin America',
    country: 'CL',
    center: { lat: -28.0, lon: -71.3 },
    spotSlugs: ['punta-de-lobos', 'pichilemu', 'arica', 'iquique'],
    searchAliases: ['Pichilemu', 'Punta de Lobos', 'Arica', 'El Gringo'],
  },
  {
    slug: 'brazil-southeast',
    name: 'Brazil — Southeast (Rio)',
    continent: 'Latin America',
    country: 'BR',
    center: { lat: -22.93, lon: -42.51 },
    spotSlugs: ['saquarema'],
    searchAliases: ['Rio de Janeiro', 'Saquarema', 'Maricá', 'Itacoatiara'],
  },
  {
    slug: 'brazil-south',
    name: 'Brazil — South',
    continent: 'Latin America',
    country: 'BR',
    center: { lat: -27.8, lon: -48.62 },
    spotSlugs: ['florianopolis', 'praia-do-rosa'],
    searchAliases: ['Florianópolis', 'Santa Catarina', 'Floripa', 'Imbituba', 'Joaquina'],
  },
  {
    slug: 'fernando-de-noronha',
    name: 'Fernando de Noronha',
    continent: 'Latin America',
    country: 'BR',
    center: { lat: -3.85, lon: -32.42 },
    spotSlugs: ['fernando-de-noronha'],
    searchAliases: ['Noronha', 'Pernambuco'],
  },

  // ── Europe ───────────────────────────────────────────────────────────────
  {
    slug: 'portugal-ericeira-peniche',
    name: 'Portugal — Ericeira & Peniche',
    continent: 'Europe',
    country: 'PT',
    center: { lat: 39.13, lon: -9.4 },
    spotSlugs: ['supertubos', 'ribeira-dilhas', 'coxos', 'guincho'],
    searchAliases: ['Ericeira', 'Peniche', 'Supertubos', 'Lisbon', 'Cascais'],
    flagship: true,
  },
  {
    slug: 'portugal-nazare',
    name: 'Portugal — Nazaré',
    continent: 'Europe',
    country: 'PT',
    center: { lat: 39.6, lon: -9.07 },
    spotSlugs: ['praia-do-norte'],
    searchAliases: ['Nazaré', 'Nazare', 'Praia do Norte', 'Big Wave'],
  },
  {
    slug: 'portugal-algarve',
    name: 'Portugal — Algarve',
    continent: 'Europe',
    country: 'PT',
    center: { lat: 37.0, lon: -8.95 },
    spotSlugs: ['sagres'],
    searchAliases: ['Algarve', 'Sagres', 'Tonel', 'Lagos'],
  },
  {
    slug: 'spain-basque-country',
    name: 'Spain — Basque Country',
    continent: 'Europe',
    country: 'ES',
    center: { lat: 43.35, lon: -2.4 },
    spotSlugs: ['mundaka', 'zarautz'],
    searchAliases: ['País Vasco', 'Euskadi', 'Mundaka', 'San Sebastián', 'Zarautz'],
  },
  {
    slug: 'spain-galicia',
    name: 'Spain — Galicia',
    continent: 'Europe',
    country: 'ES',
    center: { lat: 43.71, lon: -7.85 },
    spotSlugs: ['pantin'],
    searchAliases: ['Pantín', 'Ferrol', 'Rías Altas'],
  },
  {
    slug: 'france-landes-hossegor',
    name: 'France — Landes & Hossegor',
    continent: 'Europe',
    country: 'FR',
    center: { lat: 43.9, lon: -1.4 },
    spotSlugs: ['la-graviere', 'les-culs-nuls', 'lacanau'],
    searchAliases: ['Hossegor', 'Les Landes', 'La Gravière', 'Seignosse', 'Capbreton'],
  },
  {
    slug: 'france-basque-coast',
    name: 'France — Basque Coast',
    continent: 'Europe',
    country: 'FR',
    center: { lat: 43.5, lon: -1.55 },
    spotSlugs: ['biarritz', 'cote-des-basques', 'anglet'],
    searchAliases: ['Biarritz', 'Anglet', 'Côte Basque', "Chambre d'Amour"],
  },
  {
    slug: 'canary-islands',
    name: 'Canary Islands',
    continent: 'Europe',
    country: 'ES',
    center: { lat: 28.7, lon: -14.5 },
    spotSlugs: ['el-quemao', 'famara', 'el-confital'],
    searchAliases: ['Islas Canarias', 'Lanzarote', 'Gran Canaria', 'Canaries', 'Fuerteventura'],
  },
  {
    slug: 'uk-cornwall-devon',
    name: 'UK — Cornwall & Devon',
    continent: 'Europe',
    country: 'GB',
    admin: 'ENG',
    center: { lat: 50.4, lon: -4.7 },
    spotSlugs: ['fistral', 'croyde', 'saunton-sands', 'porthleven', 'lynmouth'],
    searchAliases: ['Cornwall', 'Devon', 'Newquay', 'Fistral', 'South West'],
  },
  {
    slug: 'scotland-north-coast',
    name: 'Scotland — North Coast',
    continent: 'Europe',
    country: 'GB',
    admin: 'SCT',
    center: { lat: 58.59, lon: -3.51 },
    spotSlugs: ['thurso-east'],
    searchAliases: ['Thurso', 'Caithness', 'Scotland'],
  },
  {
    slug: 'ireland-west-coast',
    name: 'Ireland — West Coast',
    continent: 'Europe',
    country: 'IE',
    center: { lat: 54.0, lon: -9.0 },
    spotSlugs: ['bundoran', 'mullaghmore', 'lahinch'],
    searchAliases: ['Wild Atlantic Way', 'Donegal', 'Sligo', 'County Clare', 'Bundoran'],
  },

  // ── Africa & Atlantic ────────────────────────────────────────────────────
  {
    slug: 'morocco-taghazout',
    name: 'Morocco — Taghazout',
    continent: 'Africa & Atlantic',
    country: 'MA',
    center: { lat: 30.53, lon: -9.72 },
    spotSlugs: ['anchor-point', 'hash-point', 'killer-point', 'la-source', 'safi'],
    searchAliases: ['Taghazout', 'Agadir', 'Anchor Point', 'Safi', 'Imsouane'],
  },
  {
    slug: 'south-africa-eastern-cape',
    name: 'South Africa — Eastern Cape (J-Bay)',
    continent: 'Africa & Atlantic',
    country: 'ZA',
    admin: 'EC',
    center: { lat: -33.9, lon: 25.6 },
    // cave-rock / new-pier are Durban (KZN); folded in here pending a dedicated KZN region.
    spotSlugs: ['supertubes', 'boneyards', 'cave-rock', 'new-pier'],
    searchAliases: ['Jeffreys Bay', 'J-Bay', "Jeffrey's Bay", 'Eastern Cape', 'Supertubes', 'Durban'],
  },
  {
    slug: 'south-africa-cape-town',
    name: 'South Africa — Cape Town',
    continent: 'Africa & Atlantic',
    country: 'ZA',
    admin: 'WC',
    center: { lat: -34.05, lon: 18.45 },
    spotSlugs: ['dungeons', 'muizenberg', 'elands-bay', 'victoria-bay'],
    searchAliases: ['Cape Town', 'Western Cape', 'Muizenberg', 'Dungeons', 'Hout Bay'],
  },
  {
    slug: 'namibia',
    name: 'Namibia — Skeleton Bay',
    continent: 'Africa & Atlantic',
    country: 'NA',
    center: { lat: -22.94, lon: 14.42 },
    spotSlugs: ['skeleton-bay'],
    searchAliases: ['Skeleton Bay', 'Donkey Bay', 'Walvis Bay', 'Lagoa'],
  },

  // ── Indian Ocean ─────────────────────────────────────────────────────────
  {
    slug: 'maldives',
    name: 'Maldives',
    continent: 'Indian Ocean',
    country: 'MV',
    center: { lat: 4.27, lon: 73.49 },
    spotSlugs: ['pasta-point', 'sultans', 'chickens'],
    searchAliases: ['North Malé Atoll', 'Malé', 'Male'],
  },
  {
    slug: 'sri-lanka',
    name: 'Sri Lanka',
    continent: 'Indian Ocean',
    country: 'LK',
    center: { lat: 6.84, lon: 81.84 },
    spotSlugs: ['arugam-bay'],
    searchAliases: ['Arugam Bay', 'A-Bay', 'Pottuvil', 'Weligama'],
  },
  {
    slug: 'reunion',
    name: 'Réunion',
    continent: 'Indian Ocean',
    country: 'RE',
    center: { lat: -21.13, lon: 55.28 },
    spotSlugs: ['st-leu', 'trois-bassins'],
    searchAliases: ['Reunion', 'Reunion Island', 'Saint-Leu'],
  },

  // ── Southeast Asia ───────────────────────────────────────────────────────
  {
    slug: 'bali',
    name: 'Bali',
    continent: 'Southeast Asia',
    country: 'ID',
    center: { lat: -8.75, lon: 115.15 },
    spotSlugs: ['uluwatu', 'padang-padang', 'bingin', 'keramas', 'canggu', 'medewi'],
    searchAliases: ['Bukit Peninsula', 'Uluwatu', 'Canggu', 'Kuta', 'Indonesia'],
  },
  {
    slug: 'mentawai-islands',
    name: 'Mentawai Islands',
    continent: 'Southeast Asia',
    country: 'ID',
    center: { lat: -2.2, lon: 99.75 },
    spotSlugs: ['macaronis', 'rifles', 'bank-vaults', 'hts', 'e-bay'],
    searchAliases: ['Mentawais', 'Hollow Trees', "Lance's Right", 'Playgrounds', 'Indonesia'],
  },
  {
    slug: 'sumatra-nias',
    name: 'Sumatra & Nias',
    continent: 'Southeast Asia',
    country: 'ID',
    center: { lat: 0.6, lon: 97.79 },
    spotSlugs: ['lagundri-bay'],
    searchAliases: ['Nias', 'Lagundri Bay', 'Sorake', 'Indonesia'],
  },
  {
    slug: 'java-g-land',
    name: 'Java — G-Land',
    continent: 'Southeast Asia',
    country: 'ID',
    center: { lat: -8.66, lon: 114.37 },
    spotSlugs: ['g-land'],
    searchAliases: ['Grajagan', 'G-Land', 'East Java', 'Indonesia'],
  },
  {
    slug: 'lombok',
    name: 'Lombok',
    continent: 'Southeast Asia',
    country: 'ID',
    center: { lat: -8.76, lon: 115.81 },
    spotSlugs: ['desert-point'],
    searchAliases: ['Desert Point', 'Bangko Bangko', 'Indonesia'],
  },
  {
    slug: 'philippines-siargao',
    name: 'Philippines — Siargao',
    continent: 'Southeast Asia',
    country: 'PH',
    center: { lat: 9.86, lon: 126.02 },
    spotSlugs: ['cloud-9'],
    searchAliases: ['Siargao', 'Cloud 9', 'Cloud Nine', 'Philippines'],
  },

  // ── Oceania & Pacific ────────────────────────────────────────────────────
  {
    slug: 'australia-gold-coast',
    name: 'Australia — Gold Coast',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'QLD',
    center: { lat: -28.15, lon: 153.53 },
    spotSlugs: ['snapper-rocks', 'kirra', 'burleigh-heads', 'duranbah', 'coolangatta'],
    searchAliases: ['Superbank', 'Snapper', 'Coolangatta', 'GC', 'Queensland'],
  },
  {
    slug: 'australia-northern-nsw',
    name: 'Australia — Northern NSW',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'NSW',
    center: { lat: -28.72, lon: 153.6 },
    spotSlugs: ['the-pass', 'wategos', 'lennox-head'],
    searchAliases: ['Byron Bay', 'Lennox Head', 'Ballina', 'Northern Rivers'],
  },
  {
    slug: 'australia-sydney',
    name: 'Australia — Sydney',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'NSW',
    center: { lat: -33.87, lon: 151.27 },
    spotSlugs: ['north-narrabeen', 'manly-beach', 'bondi-beach', 'maroubra', 'cronulla'],
    searchAliases: ['Sydney', 'Northern Beaches', 'Bondi', 'Maroubra', 'Narrabeen'],
  },
  {
    slug: 'australia-victoria',
    name: 'Australia — Victoria',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'VIC',
    center: { lat: -38.38, lon: 144.29 },
    spotSlugs: ['bells-beach', 'jan-juc'],
    searchAliases: ['Bells Beach', 'Torquay', 'Surf Coast', 'Great Ocean Road'],
  },
  {
    slug: 'australia-margaret-river',
    name: 'Australia — Margaret River, WA',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'WA',
    center: { lat: -32.5, lon: 115.0 },
    spotSlugs: ['surfers-point', 'the-box', 'yallingup', 'north-point'],
    searchAliases: ['Margaret River', 'Margs', 'Yallingup', 'Western Australia', 'Kalbarri'],
  },
  {
    slug: 'australia-tasmania',
    name: 'Australia — Tasmania',
    continent: 'Oceania & Pacific',
    country: 'AU',
    admin: 'TAS',
    center: { lat: -43.1, lon: 148.0 },
    spotSlugs: ['shipsterns-bluff'],
    searchAliases: ['Shipsterns', 'Shippies', 'Tassie', 'Tasman Peninsula'],
  },
  {
    slug: 'fiji',
    name: 'Fiji',
    continent: 'Oceania & Pacific',
    country: 'FJ',
    center: { lat: -17.9, lon: 177.6 },
    spotSlugs: ['cloudbreak', 'restaurants', 'frigates', 'swimming-pools'],
    searchAliases: ['Tavarua', 'Namotu', 'Cloudbreak', 'Mamanucas', 'Pacific Harbour'],
  },
  {
    slug: 'tahiti',
    name: 'Tahiti & French Polynesia',
    continent: 'Oceania & Pacific',
    country: 'PF',
    center: { lat: -17.84, lon: -149.27 },
    spotSlugs: ['teahupoo'],
    searchAliases: ["Teahupo'o", 'French Polynesia', 'Chopes', 'Tahiti'],
  },
  {
    slug: 'new-zealand',
    name: 'New Zealand',
    continent: 'Oceania & Pacific',
    country: 'NZ',
    center: { lat: -37.4, lon: 174.7 },
    spotSlugs: ['raglan', 'piha'],
    searchAliases: ['Aotearoa', 'Raglan', 'Manu Bay', 'Piha'],
  },

  // ── Japan ────────────────────────────────────────────────────────────────
  {
    slug: 'japan-chiba',
    name: 'Japan — Chiba',
    continent: 'Japan',
    country: 'JP',
    admin: 'Chiba',
    center: { lat: 35.37, lon: 140.36 },
    spotSlugs: ['tsurigasaki', 'ichinomiya'],
    searchAliases: ['Chiba', 'Ichinomiya', 'Shidashita', 'Tokyo', 'Japan'],
  },
]

// ─── Lookups ─────────────────────────────────────────────────────────────────

/** slugify(name) → first matching SurfSpot, mirroring findSpotBySlug's first-wins. */
let _spotBySlug: Map<string, SurfSpot> | null = null
function spotBySlug(): Map<string, SurfSpot> {
  if (_spotBySlug === null) {
    _spotBySlug = new Map()
    for (const spot of getAllSpots()) {
      const s = slugify(spot.name)
      if (!_spotBySlug.has(s)) _spotBySlug.set(s, spot)
    }
  }
  return _spotBySlug
}

export function getSurfRegions(): SurfRegion[] {
  return SURF_REGIONS
}

export function getSurfRegionBySlug(slug: string): SurfRegion | undefined {
  return SURF_REGIONS.find(r => r.slug === slug)
}

export function getSurfRegionsByContinent(continent: Continent): SurfRegion[] {
  return SURF_REGIONS.filter(r => r.continent === continent)
}

/** ISO alpha-2, case-insensitive. */
export function getSurfRegionsByCountry(iso2: string): SurfRegion[] {
  const c = iso2.toUpperCase()
  return SURF_REGIONS.filter(r => r.country === c)
}

/** Resolve a region's spot slugs to SurfSpot records, dropping any unknown slug. */
export function getRegionSpots(region: SurfRegion): SurfSpot[] {
  const map = spotBySlug()
  const out: SurfSpot[] = []
  for (const slug of region.spotSlugs) {
    const spot = map.get(slug)
    if (spot !== undefined) out.push(spot)
  }
  return out
}

// ─── Country aggregate (derived, spec §3) ────────────────────────────────────
// "Indonesia" isn't a region — it's the union of every ID region. Typing a
// country name synthesises this on the fly.

export interface CountryAggregate {
  country: string
  regionSlugs: string[]
  spotSlugs: string[]
  center: { lat: number; lon: number }
  bounds: [[number, number], [number, number]] | null
}

export function getCountryAggregate(iso2: string): CountryAggregate | null {
  const regions = getSurfRegionsByCountry(iso2)
  if (regions.length === 0) return null

  const regionSlugs = regions.map(r => r.slug)
  const spotSlugs = [...new Set(regions.flatMap(r => r.spotSlugs))]

  // Bounds over the resolved member spots; fall back to region centers.
  const map = spotBySlug()
  const pts: { lat: number; lon: number }[] = []
  for (const slug of spotSlugs) {
    const spot = map.get(slug)
    if (spot !== undefined) pts.push({ lat: spot.lat, lon: spot.lon })
  }
  if (pts.length === 0) pts.push(...regions.map(r => r.center))

  const lats = pts.map(p => p.lat)
  const lons = pts.map(p => p.lon)
  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const west = Math.min(...lons)
  const east = Math.max(...lons)

  return {
    country: iso2.toUpperCase(),
    regionSlugs,
    spotSlugs,
    center: { lat: (south + north) / 2, lon: (west + east) / 2 },
    bounds: pts.length > 1 ? [[south, west], [north, east]] : null,
  }
}

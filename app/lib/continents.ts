// Continent-level grouping shared by the spot directory and (later) the
// SurfRegion data. NOT the same as the granular `SurfRegion` concept
// (e.g. "Baja Sur", "North Shore, Oahu") — see docs/surf-regions-feature-spec.md.
//
// Single source of truth: import from here, never redeclare a local copy.

export const CONTINENTS = [
  'Hawaii',
  'North America',
  'Latin America',
  'Europe',
  'Africa & Atlantic',
  'Indian Ocean',
  'Southeast Asia',
  'Oceania & Pacific',
  'Japan',
] as const

export type Continent = typeof CONTINENTS[number]

// i18n key per continent — shared by the spot directory chips and the regions
// index chips. Typed as Record<Continent, …> so adding a continent above fails
// the build until its key is added here too.
export const CONTINENT_I18N: Record<Continent, string> = {
  'Hawaii':            'top100.region.hawaii',
  'North America':     'top100.region.northAmerica',
  'Latin America':     'top100.region.latinAmerica',
  'Europe':            'top100.region.europe',
  'Africa & Atlantic': 'top100.region.africaAtlantic',
  'Indian Ocean':      'top100.region.indianOcean',
  'Southeast Asia':    'top100.region.southeastAsia',
  'Oceania & Pacific': 'top100.region.oceania',
  'Japan':             'top100.region.japan',
}

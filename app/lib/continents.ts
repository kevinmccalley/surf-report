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

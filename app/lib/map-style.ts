import type { StyleSpecification } from 'maplibre-gl'

// Basemap styles for SurfMap + RegionMap. CARTO's keyless basemap CDN now
// watermarks its tiles, so both maps use OpenFreeMap instead — free, no key,
// no rate limit (self-hostable if that ever changes). OpenFreeMap serves the
// OpenMapTiles vector schema.
//
// Light: OpenFreeMap's hosted "positron" style (CARTO Positron look-alike).
// Dark: hand-authored below — OpenFreeMap doesn't host a dark style, and a
// compact one tuned for a surf app (ocean reads brighter than land, roads and
// labels muted) beats vendoring the full 1,500-line dark-matter style.

const OFM_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
const OFM_TILES = 'https://tiles.openfreemap.org/planet'
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

export const OPENFREEMAP_LIGHT = 'https://tiles.openfreemap.org/styles/positron'

// Palette — deep navy ground, ocean a step lighter so coastline reads, warm-grey ink.
const C = {
  ground: '#0b1220',
  water: '#101f33',
  waterway: '#16273d',
  wood: '#0f1a1d',
  grass: '#101a20',
  building: '#141c2e',
  roadMajor: '#2b3450',
  roadMinor: '#1c2439',
  boundary: '#33405f',
  label: '#93a6c6',
  labelMinor: '#6d7c9c',
  labelWater: '#5f83b0',
  halo: '#0b1220',
}

export const OPENFREEMAP_DARK = {
  version: 8,
  name: 'Groundswell Dark',
  glyphs: OFM_GLYPHS,
  sources: {
    openmaptiles: { type: 'vector', url: OFM_TILES, attribution: ATTRIBUTION },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': C.ground } },
    {
      id: 'landcover-wood', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'], paint: { 'fill-color': C.wood, 'fill-opacity': 0.6 },
    },
    {
      id: 'landcover-grass', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: ['in', 'class', 'grass', 'scrub', 'meadow'], paint: { 'fill-color': C.grass, 'fill-opacity': 0.5 },
    },
    {
      id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      filter: ['!=', 'brunnel', 'tunnel'], paint: { 'fill-color': C.water },
    },
    {
      id: 'waterway', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      paint: { 'line-color': C.waterway, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 1.5] },
    },
    {
      id: 'building', type: 'fill', source: 'openmaptiles', 'source-layer': 'building',
      minzoom: 13, paint: { 'fill-color': C.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 15, 0.7] },
    },
    {
      id: 'road-minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', 'class', 'minor', 'service', 'track'], minzoom: 12,
      paint: { 'line-color': C.roadMinor, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 18, 3] },
    },
    {
      id: 'road-secondary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'], minzoom: 9,
      paint: { 'line-color': C.roadMinor, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 18, 5] },
    },
    {
      id: 'road-primary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', 'class', 'primary', 'trunk', 'motorway'], minzoom: 6,
      paint: {
        'line-color': C.roadMajor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.8, 18, 8],
      },
    },
    {
      id: 'boundary-country', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      filter: ['<=', 'admin_level', 2],
      paint: { 'line-color': C.boundary, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 10, 1.6], 'line-dasharray': [3, 2] },
    },
    {
      id: 'place-water', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name',
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 14],
        'text-max-width': 6,
      },
      paint: { 'text-color': C.labelWater, 'text-halo-color': C.halo, 'text-halo-width': 1.1 },
    },
    {
      id: 'place-minor', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      filter: ['in', 'class', 'town', 'village', 'suburb'], minzoom: 8,
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 14],
        'text-max-width': 7,
      },
      paint: { 'text-color': C.labelMinor, 'text-halo-color': C.halo, 'text-halo-width': 1.1 },
    },
    {
      id: 'place-city', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      filter: ['in', 'class', 'city', 'country', 'state'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 10, 18],
        'text-max-width': 8,
      },
      paint: { 'text-color': C.label, 'text-halo-color': C.halo, 'text-halo-width': 1.3 },
    },
  ],
} as unknown as StyleSpecification

/** Basemap style for the viewer's theme — URL string (light) or inline spec (dark). */
export function mapStyle(isDark: boolean): string | StyleSpecification {
  return isDark ? OPENFREEMAP_DARK : OPENFREEMAP_LIGHT
}

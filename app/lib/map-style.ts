import type { StyleSpecification } from 'maplibre-gl'
import { layers, LIGHT, DARK } from '@protomaps/basemaps'

// Basemap style for SurfMap + RegionMap + WorldRegionsMap.
//
// Vector tiles come from a self-hosted Protomaps PMTiles archive — one
// `.pmtiles` file on object storage (Cloudflare R2), read directly by the
// browser over HTTP range requests via the `pmtiles://` protocol. No tile
// server, no API key, no per-request cost. See docs/pmtiles-basemap-setup.md
// for how the file is built and hosted.
//
// History: started on CARTO's keyless basemap (began watermarking), moved to
// OpenFreeMap's hosted tiles (started returning empty tiles site-wide on
// 2026-08-26). Self-hosting the archive removes the third-party runtime
// dependency entirely.
//
// `NEXT_PUBLIC_PMTILES_URL` points at the hosted archive. When it's unset we
// fall back to the Protomaps planet archive on source.coop (Radiant Earth's
// free open-data host — CORS + HTTP range requests, ~135 GB planet). That's a
// real working basemap for dev and previews, but it's still someone else's
// bucket: host your own for production (control over CORS, caching, retention).
//
// Glyphs + sprites are the small static asset bundle Protomaps publishes
// (protomaps/basemaps-assets, served from GitHub Pages). They're a few hundred
// KB, cache hard, and have a completely different failure profile from a
// dynamic tile endpoint. Self-host them too if you want zero third-party calls
// at runtime — set NEXT_PUBLIC_MAP_ASSETS_URL to your copy's base URL.

const FALLBACK_PMTILES = 'https://data.source.coop/protomaps/openstreetmap/v4.pmtiles'
const DEFAULT_ASSETS = 'https://protomaps.github.io/basemaps-assets'

/** Public URL of the hosted `.pmtiles` archive (falls back to the source.coop planet). */
export const PMTILES_URL = process.env.NEXT_PUBLIC_PMTILES_URL?.trim() || FALLBACK_PMTILES

/** True when we're on the shared public archive rather than our own host. */
export const USING_FALLBACK_PMTILES = PMTILES_URL === FALLBACK_PMTILES

const ASSETS_URL = process.env.NEXT_PUBLIC_MAP_ASSETS_URL?.trim() || DEFAULT_ASSETS

const ATTRIBUTION =
  '<a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a> © ' +
  '<a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

function buildStyle(isDark: boolean): StyleSpecification {
  const flavor = isDark ? DARK : LIGHT
  return {
    version: 8,
    glyphs: `${ASSETS_URL}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${ASSETS_URL}/sprites/v4/${isDark ? 'dark' : 'light'}`,
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
        attribution: ATTRIBUTION,
      },
    },
    layers: layers('protomaps', flavor, { lang: 'en' }),
  } as unknown as StyleSpecification
}

/** Basemap style for the viewer's theme. */
export function mapStyle(isDark: boolean): StyleSpecification {
  return buildStyle(isDark)
}

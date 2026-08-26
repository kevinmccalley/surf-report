import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { PMTILES_URL, USING_DEMO_PMTILES } from '@/app/lib/map-style'

// Register the `pmtiles://` protocol on MapLibre GL exactly once, on the client.
//
// The basemap is a single self-hosted Protomaps `.pmtiles` archive read over
// HTTP range requests — no tile server. MapLibre needs the `pmtiles` protocol
// handler wired in before any style with a `pmtiles://` source is created.
//
// `@maplibre/maplibre-gl-leaflet` does `require("maplibre-gl")`, which the
// bundler dedupes to the very module instance imported here — so registering
// once covers the Leaflet-bridged maps (RegionMap / SurfMap) and the plain GL
// map (WorldRegionsMap) alike. Every map component calls this from its mount
// effect; the guard makes the extra calls no-ops.

let registered = false

export function registerPmtilesProtocol(): void {
  if (registered || typeof window === 'undefined') return
  const protocol = new Protocol({ metadata: true })
  maplibregl.addProtocol('pmtiles', protocol.tile)
  registered = true

  if (USING_DEMO_PMTILES) {
    console.warn(
      '[map] NEXT_PUBLIC_PMTILES_URL is unset — using the Protomaps demo archive ' +
        `(${PMTILES_URL}). Rate-limited and not for production; host your own ` +
        'per docs/pmtiles-basemap-setup.md.',
    )
  }
}

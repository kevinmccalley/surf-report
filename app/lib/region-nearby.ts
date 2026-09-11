// Secondary (non-curated) spots near a region — widens a region page's
// "Breaks in this region" list beyond the hand-picked `spotSlugs`, using the
// same ~6,900-entry Surfline directory that /api/nearby already draws from.
// The curated set stays the "featured" numbered pins; this fills in the rest
// of what's actually out there nearby, same as the Spots Nearby widget shows
// on an individual spot page.

import surflineSpots from './surf-spots.json'
import { getRegionSpots, type SurfRegion } from './surf-regions'
import { slugify } from './surf-spots'
import type { RegionMapPoint } from './region-map'

interface RawSpot { name: string; lat: number; lon: number }

const MIN_RADIUS_KM = 25
const RADIUS_BUFFER_KM = 10
const DEDUPE_KM = 2
const MAX_SECONDARY = 30

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface SecondarySpot extends RegionMapPoint {
  distanceKm: number
}

/**
 * Surfline-directory spots near a region that aren't already part of its
 * curated `spotSlugs`. The catchment radius grows with how spread out the
 * curated spots themselves already are, so a wide region doesn't clip its
 * own neighbourhood down to a too-small circle.
 */
export function getRegionSecondarySpots(region: SurfRegion): SecondarySpot[] {
  const { lat: cLat, lon: cLon } = region.center
  const curated = getRegionSpots(region)
  const curatedSlugs = new Set(curated.map(s => slugify(s.name)))
  const curatedReach = curated.reduce((m, s) => Math.max(m, haversineKm(cLat, cLon, s.lat, s.lon)), 0)
  const radiusKm = Math.max(MIN_RADIUS_KM, curatedReach + RADIUS_BUFFER_KM)

  const seenSlugs = new Set<string>()
  const out: SecondarySpot[] = []

  for (const raw of surflineSpots as RawSpot[]) {
    const slug = slugify(raw.name)
    if (!slug || curatedSlugs.has(slug) || seenSlugs.has(slug)) continue

    const distanceKm = haversineKm(cLat, cLon, raw.lat, raw.lon)
    if (distanceKm > radiusKm) continue
    // Cross-source dedupe by proximity too — catches name variants (accents,
    // "D'Ilhas" vs "d'Ilhas") that slugify differently from the curated entry.
    if (curated.some(c => haversineKm(c.lat, c.lon, raw.lat, raw.lon) < DEDUPE_KM)) continue

    seenSlugs.add(slug)
    out.push({ slug, name: raw.name, lat: raw.lat, lon: raw.lon, distanceKm })
  }

  return out.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_SECONDARY)
}

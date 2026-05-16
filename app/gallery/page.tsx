import fs from 'fs'
import path from 'path'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SPOTS } from '@/app/top100/spots-data'
import GalleryClient, { type GalleryTileData } from './GalleryClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Surf Gallery — Groundswell',
  description: 'World-class surf spot photography',
}

// Legacy map for irregular filenames (predates slug convention)
const LEGACY_FILENAME_MAP: Record<string, string> = {
  'jbay':          'Jeffreys Bay',
  'padangPadang':  'Padang Padang',
  'peru-chicama':  'Chicama',
  'raglan':        'Raglan',
  'skeleton-bay':  'Skeleton Bay',
  'sunset-hi':     'Sunset Beach',
  'teahopo':       "Teahupo'o",
}

// Normalize a string to a slug for auto-matching (e.g. "Teahupo'o" → "teahupoo")
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .replace(/'/g, '')               // strip apostrophes
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric → hyphen
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
}

export default async function GalleryPage() {
  // ── Auth / whitelist ────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
  const allowed = (process.env.BYPASS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(email)) redirect('/')

  // ── Read images from public dir ─────────────────────────────────────────
  const dir = path.join(process.cwd(), 'public', 'images', 'topSpots')
  let imageFiles: string[] = []
  try {
    imageFiles = fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
  } catch {}

  // ── Build tile list: matched image spots first, then remaining in rank order ──
  const spotsBySlug = new Map(SPOTS.map(s => [slugify(s.name), s]))

  const tiles: GalleryTileData[] = []
  const usedNames = new Set<string>()

  for (const filename of imageFiles) {
    const stem = filename.replace(/\.[^/.]+$/, '')
    const legacyName = LEGACY_FILENAME_MAP[stem]
    const spot = legacyName
      ? SPOTS.find(s => s.name === legacyName)
      : spotsBySlug.get(slugify(stem))
    if (!spot) continue
    tiles.push({
      rank:       spot.rank,
      name:       spot.name,
      locality:   spot.locality,
      country:    spot.country,
      lat:        spot.lat,
      lon:        spot.lon,
      waveType:   spot.waveType,
      difficulty: spot.difficulty,
      bestSeason: spot.bestSeason,
      wslBadge:   spot.wslBadge,
      imageSrc:   `/images/topSpots/${filename}`,
    })
    usedNames.add(spot.name)
  }

  for (const spot of SPOTS) {
    if (usedNames.has(spot.name)) continue
    tiles.push({
      rank:       spot.rank,
      name:       spot.name,
      locality:   spot.locality,
      country:    spot.country,
      lat:        spot.lat,
      lon:        spot.lon,
      waveType:   spot.waveType,
      difficulty: spot.difficulty,
      bestSeason: spot.bestSeason,
      wslBadge:   spot.wslBadge,
      imageSrc:   null,
    })
  }

  return <GalleryClient tiles={tiles} />
}

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

// Map image filename stem → exact spot name in spots-data
const IMAGE_SPOT_MAP: Record<string, string> = {
  'jbay':          'Jeffreys Bay',
  'padangPadang':  'Padang Padang',
  'peru-chicama':  'Chicama',
  'raglan':        'Raglan',
  'skeleton-bay':  'Skeleton Bay',
  'sunset-hi':     'Sunset Beach',
  'teahopo':       "Teahupo'o",
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
  const tiles: GalleryTileData[] = []
  const usedNames = new Set<string>()

  for (const filename of imageFiles) {
    const stem = filename.replace(/\.[^/.]+$/, '')
    const spotName = IMAGE_SPOT_MAP[stem]
    if (!spotName) continue
    const spot = SPOTS.find(s => s.name === spotName)
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

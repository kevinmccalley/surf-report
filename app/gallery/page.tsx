import fs from 'fs'
import path from 'path'
import GalleryClient from './GalleryClient'

export const metadata = {
  title: 'Surf Gallery — Groundswell',
  description: 'World-class surf spot photography',
}

export default function GalleryPage() {
  const dir = path.join(process.cwd(), 'public', 'images', 'topSpots')
  let images: string[] = []
  try {
    images = fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
  } catch {}
  return <GalleryClient images={images} />
}

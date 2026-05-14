'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export const dynamic = 'force-dynamic'

export default function StudioPage() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.href)
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded) return null
  if (!isSignedIn) return null

  return <NextStudio config={config} />
}

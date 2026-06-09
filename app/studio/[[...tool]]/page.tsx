import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import StudioClient from './StudioClient'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?redirect_url=/studio')
  }
  return <StudioClient />
}

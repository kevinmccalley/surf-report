import { auth, clerkClient } from '@clerk/nextjs/server'
import SurfApp from './components/SurfApp'
import MarketingPage from './components/MarketingPage'

export default async function Page() {
  const { userId } = await auth()

  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const meta = user.privateMetadata as { subscriptionStatus?: string }
    if (meta.subscriptionStatus === 'active') {
      return <SurfApp />
    }
  }

  return <MarketingPage />
}

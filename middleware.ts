import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/surf(.*)',
  '/api/tides(.*)',
  '/api/geocode(.*)',
  '/api/climatology(.*)',
  '/api/surf-history(.*)',
  '/api/usage(.*)',
  '/api/webhook(.*)',
  '/api/monitor(.*)',
  '/api/accuracy-check(.*)',
  '/api/accuracy-backfill(.*)',
  '/api/accuracy-history(.*)',
  '/api/nearby(.*)',
  '/api/buoy(.*)',
  '/api/epic-now(.*)',
  '/api/cron/epic-now(.*)',
  '/api/cron/swell-alert(.*)',
  '/api/clerk-webhook(.*)',
  '/accuracy(.*)',
  '/climatology(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/support(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      // Return JSON 401 for API routes instead of redirecting to sign-in HTML
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      await auth.protect()
    }
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
}

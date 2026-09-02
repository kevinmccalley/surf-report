import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sitemap.xml',
  '/robots.txt',
  '/BingSiteAuth.xml',
  '/faq(.*)',
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
  '/api/blog/translate(.*)',
  '/api/cron/epic-now(.*)',
  '/api/cron/region-conditions(.*)',
  '/api/cron/swell-alert(.*)',
  '/api/cron/swell-alert-check(.*)',
  '/api/clerk-webhook(.*)',
  '/api/model-comparison(.*)',
  '/about(.*)',
  '/accuracy(.*)',
  '/climatology(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/support(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/blog(.*)',
  '/api/og(.*)',
  '/studio(.*)',
  '/spots(.*)',
  '/regions(.*)',
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
  // Clerk's middleware stamps `Cache-Control: private, no-store` on every response
  // it touches, which defeats CDN/ISR caching for otherwise-static content. The
  // routes listed after `_next` below never call `auth()` / `currentUser()` /
  // `clerkClient()` server-side (verified) and `<ClerkProvider>` is static, so
  // they can skip Clerk entirely and let Next's own cache headers reach the edge.
  // Anything that reads auth (`/`, `/spots/*`, `/regions/*`, `/accuracy`, ops
  // pages) MUST stay matched.
  matcher: ['/((?!_next|about|blog|climatology|faq|terms|privacy|refund|support|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)'],
}

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Permanent redirects for spot/climatology URLs that Google has indexed but that
// no longer resolve — a renamed or removed break. Keep this list tiny; it's for
// pages with real search impressions, not every historical slug.
//   nantucket -> cisco-beach : "Nantucket" was never a catalog slug (the break
//   is Cisco Beach, Nantucket MA); the /climatology/nantucket page still pulls
//   GSC impressions. See docs/seo-audit-2026-09-10.md.
const PERMANENT_REDIRECTS: Record<string, string> = {
  '/spots/nantucket': '/spots/cisco-beach',
  '/climatology/nantucket': '/climatology/cisco-beach',
}

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
  const redirectTo = PERMANENT_REDIRECTS[req.nextUrl.pathname]
  if (redirectTo) {
    const url = req.nextUrl.clone()
    url.pathname = redirectTo
    return NextResponse.redirect(url, 301)
  }

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
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)'],
}

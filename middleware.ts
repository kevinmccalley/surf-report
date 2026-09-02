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

// Public, non-personalised content that is safe to sit on the CDN. `cookies()` in
// the root layout forces every route into dynamic rendering, so Next sends
// `Cache-Control: private, no-store` on all HTML — defeating ISR/edge caching on
// hundreds of essentially-static pages (climatology per spot, blog, legal, about).
// None of these read auth server-side, and their SSR output does not vary by
// cookie: the legal/about pages apply locale client-side, and blog/climatology
// take locale from the `?lang=` URL param (cached per-URL). Overriding the header
// here in middleware lets the edge cache them; `s-maxage` is shared-CDN only, the
// browser still revalidates.
const isCacheableContent = createRouteMatcher([
  '/about(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/support(.*)',
  '/blog(.*)',
  '/climatology(.*)',
])
const CACHEABLE_CONTENT_CC = 'public, s-maxage=3600, stale-while-revalidate=86400'

export default clerkMiddleware(async (auth, req) => {
  if (req.method === 'GET' && isCacheableContent(req)) {
    const res = NextResponse.next()
    res.headers.set('Cache-Control', CACHEABLE_CONTENT_CC)
    return res
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

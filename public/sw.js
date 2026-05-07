const CACHE = 'groundswell-v1'

const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: precache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API/auth, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept Clerk, API routes, or non-GET requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('clerk') ||
    url.hostname.includes('stripe') ||
    url.hostname.includes('lemonsqueezy')
  ) {
    return
  }

  // Cache-first for static assets (_next/static, icons, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Network-first for HTML pages — fall back to cached '/' if offline
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok && request.headers.get('accept')?.includes('text/html')) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request).then(c => c || caches.match('/')))
  )
})

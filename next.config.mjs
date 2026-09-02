/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during `next build` — run it separately in CI, not on every deploy.
  // ESLint on 114 files costs 20-40 seconds per build.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable named-import tree-shaking for barrel packages. Avoids pulling in entire
  // icon/chart/animation libraries when only a handful of exports are used.
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'sanity', 'next-sanity'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      {
        // Canonicalise the apex — www serves a full duplicate of the site today.
        source: '/:path*',
        has: [{ type: 'host', value: 'www.groundswell.surf' }],
        destination: 'https://groundswell.surf/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Baseline security headers on every route. Deliberately no CSP — the app
        // pulls in Clerk, Stripe, Sanity, Vercel Analytics, the Meta pixel and
        // Google Fonts, so a hand-rolled policy is high-risk; X-Frame-Options
        // covers the clickjacking case without that risk.
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), browsing-topics=()' },
        ],
      },
      {
        // Cron/webhook routes must never be cached — they need to reach the
        // serverless function every time, not a stale edge response.
        source: '/api/:path(monitor|accuracy-check)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // OG card images are deterministic per query string — cache them hard.
        source: '/api/og',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Everything else under /api/ gets a short shared cache. Excludes /api/og
        // (handled above) so there's no duplicate Cache-Control.
        source: '/api/:path((?!og).*)',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=1800, stale-while-revalidate=3600' },
        ],
      },
    ]
  },
}

export default nextConfig

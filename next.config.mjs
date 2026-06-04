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
  async headers() {
    return [
      {
        // Cron/webhook routes must never be cached — they need to reach the
        // serverless function every time, not a stale edge response.
        source: '/api/:path(monitor|accuracy-check)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=1800, stale-while-revalidate=3600' },
        ],
      },
    ]
  },
}

export default nextConfig

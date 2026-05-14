/** @type {import('next').NextConfig} */
const nextConfig = {
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

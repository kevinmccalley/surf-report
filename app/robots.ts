import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sign-in',
          '/sign-up',
          '/studio/',
          '/debug',
        ],
      },
    ],
    sitemap: 'https://groundswell.surf/sitemap.xml',
  }
}

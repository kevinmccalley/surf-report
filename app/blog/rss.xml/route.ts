import { getAllPosts } from '@/app/lib/sanity'

const BASE_URL = 'https://groundswell.surf'

export const revalidate = 3600

export async function GET() {
  const posts = await getAllPosts()

  const items = posts
    .map(post => {
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''
      const categories = post.categories?.map(c => `<category>${escapeXml(c.title)}</category>`).join('') ?? ''
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug.current}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug.current}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      ${post.author ? `<author>${escapeXml(post.author.name)}</author>` : ''}
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      ${categories}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Groundswell Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Wave science, forecasting tips, and surf stories from around the world.</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} Groundswell</copyright>
    <ttl>60</ttl>
    <atom:link href="${BASE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

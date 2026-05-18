import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from 'next-sanity'

// Each call translates ONE locale — stays well under Vercel's 60s limit.
export const maxDuration = 60

const LOCALE_MAP: Record<string, string> = {
  es:   'Spanish',
  fr:   'French',
  ptBR: 'Brazilian Portuguese',
  ptPT: 'European Portuguese (as spoken in Portugal)',
}

// ── PortableText helpers ───────────────────────────────────────────────────────

interface TextItem { key: string; text: string }

function extractTextItems(body: unknown[]): TextItem[] {
  const items: TextItem[] = []
  for (let i = 0; i < body.length; i++) {
    const block = body[i] as Record<string, unknown>
    if (block._type === 'block' && Array.isArray(block.children)) {
      const children = block.children as Array<Record<string, unknown>>
      for (let j = 0; j < children.length; j++) {
        const child = children[j]
        if (child._type === 'span' && typeof child.text === 'string' && child.text.trim()) {
          items.push({ key: `b${i}s${j}`, text: child.text as string })
        }
      }
    } else if (block._type === 'callout' && typeof block.content === 'string' && (block.content as string).trim()) {
      items.push({ key: `c${i}`, text: block.content as string })
    }
  }
  return items
}

function applyTextTranslations(body: unknown[], map: Record<string, string>): unknown[] {
  return body.map((block, i) => {
    const b = block as Record<string, unknown>
    if (b._type === 'block' && Array.isArray(b.children)) {
      return {
        ...b,
        children: (b.children as Array<Record<string, unknown>>).map((child, j) => {
          const key = `b${i}s${j}`
          if (child._type === 'span' && key in map) return { ...child, text: map[key] }
          return child
        }),
      }
    } else if (b._type === 'callout' && `c${i}` in map) {
      return { ...b, content: map[`c${i}`] }
    }
    return block
  })
}

// ── Translation logic ─────────────────────────────────────────────────────────

interface PostData {
  title: string
  excerpt: string
  body?: unknown[]
  seoTitle?: string
  seoDescription?: string
}

interface TranslateResult {
  title: string
  excerpt: string
  seoTitle: string | null
  seoDescription: string | null
  bodyItems: TextItem[]
}

async function translateToLocale(
  anthropic: Anthropic,
  post: PostData,
  lang: string,
): Promise<Record<string, unknown>> {
  const allBodyItems = post.body ? extractTextItems(post.body) : []
  // Cap at 200 spans so the prompt stays within a ~20s response window on Haiku
  const bodyItems = allBodyItems.slice(0, 200)

  const payload = {
    title: post.title,
    excerpt: post.excerpt,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    bodyItems,
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: 'You are a professional translator specializing in surf, ocean sports, and outdoor adventure content. You translate accurately, naturally, and preserve technical terminology.',
    messages: [{
      role: 'user',
      content: `Translate the following surf blog content from English to ${lang}.

Return ONLY valid JSON with this exact structure — no markdown fences, no preamble:
{
  "title": "...",
  "excerpt": "...",
  "seoTitle": "..." or null,
  "seoDescription": "..." or null,
  "bodyItems": [{ "key": "...", "text": "..." }, ...]
}

Rules:
- Preserve proper nouns: place names, surf spot names (Pipeline, Jaws, Teahupo'o, etc.), person names, brand names
- Use natural surf terminology in the target language where it exists; keep English terms if no natural equivalent
- Preserve any inline formatting markers (**bold**, *italic*) exactly as-is
- The bodyItems array must have the exact same length and same keys as the input, only translate the text values
- Return valid JSON only

Content:
${JSON.stringify(payload, null, 2)}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON found in Claude response`)

  const result = JSON.parse(jsonMatch[0]) as TranslateResult

  const textMap: Record<string, string> = {}
  for (const item of result.bodyItems ?? []) {
    textMap[item.key] = item.text
  }

  return {
    title: result.title,
    excerpt: result.excerpt,
    ...(result.seoTitle ? { seoTitle: result.seoTitle } : {}),
    ...(result.seoDescription ? { seoDescription: result.seoDescription } : {}),
    ...(post.body ? { body: applyTextTranslations(post.body, textMap) } : {}),
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { postId?: string; locale?: string } | null
    const postId = body?.postId
    const locale = body?.locale

    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    if (!locale) return NextResponse.json({ error: 'locale is required' }, { status: 400 })

    const lang = LOCALE_MAP[locale]
    if (!lang) return NextResponse.json({ error: `Unsupported locale: ${locale}` }, { status: 400 })

    const projectId  = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset    = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
    const readToken  = process.env.SANITY_API_READ_TOKEN
    const writeToken = process.env.SANITY_API_WRITE_TOKEN

    if (!projectId)                    return NextResponse.json({ error: 'NEXT_PUBLIC_SANITY_PROJECT_ID not set' }, { status: 500 })
    if (!writeToken)                   return NextResponse.json({ error: 'SANITY_API_WRITE_TOKEN not set' }, { status: 500 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    const readClient = createClient({
      projectId, dataset, apiVersion: '2025-05-14', useCdn: false,
      ...(readToken ? { token: readToken } : {}),
    })

    const baseId = postId.replace(/^drafts\./, '')

    const post = await readClient.fetch<PostData | null>(
      `*[_type == "post" && _id == $id && !(_id in path("drafts.**"))][0] {
        title, excerpt, body, seoTitle, seoDescription
      }`,
      { id: baseId },
    )

    if (!post) {
      return NextResponse.json({ error: 'Published post not found. Publish the post before translating.' }, { status: 404 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const translation = await translateToLocale(anthropic, post, lang)

    const writeClient = createClient({
      projectId, dataset, apiVersion: '2025-05-14', useCdn: false, token: writeToken,
    })

    await writeClient.patch(baseId).set({ [`translations.${locale}`]: translation }).commit()

    return NextResponse.json({ ok: true, locale })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[translate] Unhandled error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

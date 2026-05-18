import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from 'next-sanity'

export const maxDuration = 300

const TRANSLATE_LOCALES = [
  { key: 'es',   lang: 'Spanish' },
  { key: 'fr',   lang: 'French' },
  { key: 'ptBR', lang: 'Brazilian Portuguese' },
  { key: 'ptPT', lang: 'European Portuguese (as spoken in Portugal)' },
] as const

type LocaleKey = typeof TRANSLATE_LOCALES[number]['key']

// No auth gate — callers can't do anything without the server-side
// SANITY_API_WRITE_TOKEN and ANTHROPIC_API_KEY, so the endpoint is self-protecting.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAuthorized(_req: NextRequest): boolean {
  return true
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
    // Images and codeBlocks pass through untranslated
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

async function translateLocale(
  anthropic: Anthropic,
  post: PostData,
  localeKey: LocaleKey,
  lang: string,
): Promise<Record<string, unknown>> {
  const bodyItems = post.body ? extractTextItems(post.body) : []

  const payload = {
    title: post.title,
    excerpt: post.excerpt,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    bodyItems,
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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
  if (!jsonMatch) throw new Error(`No JSON found in Claude response for ${localeKey}`)

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
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as { postId?: string } | null
  const postId = body?.postId
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  const readToken = process.env.SANITY_API_READ_TOKEN
  const writeToken = process.env.SANITY_API_WRITE_TOKEN

  if (!projectId)   return NextResponse.json({ error: 'NEXT_PUBLIC_SANITY_PROJECT_ID not set' }, { status: 500 })
  if (!writeToken)  return NextResponse.json({ error: 'SANITY_API_WRITE_TOKEN not set' }, { status: 500 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const readClient = createClient({
    projectId, dataset, apiVersion: '2025-05-14', useCdn: false,
    ...(readToken ? { token: readToken } : {}),
  })

  // Strip drafts. prefix — always translate the published document
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

  // Translate all locales in parallel
  const settled = await Promise.allSettled(
    TRANSLATE_LOCALES.map(({ key, lang }) => translateLocale(anthropic, post, key, lang))
  )

  const translations: Record<string, unknown> = {}
  const errors: string[] = []

  TRANSLATE_LOCALES.forEach(({ key, lang }, i) => {
    const r = settled[i]
    if (r.status === 'fulfilled') {
      translations[key] = r.value
    } else {
      errors.push(`${lang}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`)
      console.error(`[translate] ${lang} failed:`, r.reason)
    }
  })

  if (Object.keys(translations).length === 0) {
    return NextResponse.json({ error: 'All translations failed', details: errors }, { status: 500 })
  }

  const writeClient = createClient({
    projectId, dataset, apiVersion: '2025-05-14', useCdn: false, token: writeToken,
  })

  await writeClient.patch(baseId).set({ translations }).commit()

  return NextResponse.json({
    ok: true,
    translated: Object.keys(translations),
    ...(errors.length > 0 ? { errors } : {}),
  })
}

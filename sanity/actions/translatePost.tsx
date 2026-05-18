import { useState } from 'react'
import type { DocumentActionProps } from 'sanity'

export function TranslatePostAction({ id, type, published }: DocumentActionProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  if (type !== 'post') return null

  const isPublished = Boolean(published)

  return {
    label:    loading ? 'Translating…' : 'Translate to all languages',
    disabled: !isPublished || loading,
    title:    isPublished
      ? 'Translate to Spanish, French, and Portuguese via Claude (~20 s)'
      : 'Publish the post first, then translate',

    // Shows a modal after the async job finishes
    dialog: result
      ? {
          type:    'confirm' as const,
          tone:    result.ok ? ('positive' as const) : ('critical' as const),
          header:  result.ok ? 'Translations saved!' : 'Translation failed',
          message: result.message,
          onCancel:  () => setResult(null),
          onConfirm: () => setResult(null),
          confirmButtonText: 'OK',
          cancelButtonText:  result.ok ? undefined : 'Dismiss',
        }
      : undefined,

    onHandle: async () => {
      setLoading(true)
      setResult(null)
      try {
        const token = process.env.NEXT_PUBLIC_BLOG_TRANSLATE_TOKEN
        const res = await fetch('/api/blog/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ postId: id }),
        })
        const data = await res.json().catch(() => ({ error: res.statusText })) as {
          ok?: boolean
          translated?: string[]
          error?: unknown
        }
        if (!res.ok) {
          const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error) ?? res.statusText
          throw new Error(msg)
        }
        const langs = (data.translated ?? []).join(', ')
        setResult({ ok: true, message: `Successfully translated to: ${langs}` })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[TranslatePostAction]', err)
        setResult({ ok: false, message: msg })
      } finally {
        setLoading(false)
      }
    },
  }
}

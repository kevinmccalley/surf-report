import { useState } from 'react'
import type { DocumentActionProps } from 'sanity'

const LOCALES = [
  { key: 'es',   label: 'Spanish' },
  { key: 'fr',   label: 'French' },
  { key: 'ptBR', label: 'Brazilian Portuguese' },
  { key: 'ptPT', label: 'European Portuguese' },
]

export function TranslatePostAction({ id, type, published }: DocumentActionProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  if (type !== 'post') return null

  const isPublished = Boolean(published)

  return {
    label:    loading ? 'Translating…' : 'Translate to all languages',
    disabled: !isPublished || loading,
    title:    isPublished
      ? 'Translate to Spanish, French, and Portuguese via Claude (~30 s)'
      : 'Publish the post first, then translate',

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
        // Fire one request per locale in parallel — each stays under the 60s function limit
        const settled = await Promise.allSettled(
          LOCALES.map(({ key }) =>
            fetch('/api/blog/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId: id, locale: key }),
            }).then(async (res) => {
              const data = await res.json().catch(() => ({ error: res.statusText })) as {
                ok?: boolean
                locale?: string
                error?: unknown
              }
              if (!res.ok) {
                const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error) ?? res.statusText
                throw new Error(`${key}: ${msg}`)
              }
              return key
            })
          )
        )

        const succeeded: string[] = []
        const failed: string[] = []

        settled.forEach((r) => {
          if (r.status === 'fulfilled') {
            succeeded.push(r.value)
          } else {
            failed.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
          }
        })

        if (succeeded.length === 0) {
          setResult({ ok: false, message: `All translations failed:\n${failed.join('\n')}` })
        } else if (failed.length > 0) {
          setResult({
            ok: true,
            message: `Translated: ${succeeded.join(', ')}\nFailed: ${failed.join('; ')}`,
          })
        } else {
          setResult({ ok: true, message: `Successfully translated to: ${succeeded.join(', ')}` })
        }
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

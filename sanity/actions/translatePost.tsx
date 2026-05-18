import { useToast } from 'sanity'
import { useState } from 'react'
import type { DocumentActionProps } from 'sanity'

export function TranslatePostAction({ id, type, published }: DocumentActionProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  if (type !== 'post') return null

  const isPublished = Boolean(published)

  return {
    label:    loading ? 'Translating…' : 'Translate to all languages',
    disabled: !isPublished || loading,
    title:    isPublished
      ? 'Translate this post to Spanish, French, and Portuguese via Claude'
      : 'Publish the post first, then translate',
    onHandle: async () => {
      setLoading(true)
      toast.push({ title: 'Translating…', description: 'Claude is translating to ES, FR, PT-BR, PT-PT. This takes ~20 seconds.', status: 'info', duration: 25000 })
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
        const data = await res.json().catch(() => ({ error: res.statusText }))
        if (!res.ok) throw new Error(data.error ?? res.statusText)

        const langs = (data.translated as string[] ?? []).join(', ')
        toast.push({ title: 'Translations saved!', description: `Translated to: ${langs}`, status: 'success', duration: 6000 })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[TranslatePostAction]', err)
        toast.push({ title: 'Translation failed', description: msg, status: 'error', duration: 8000 })
      } finally {
        setLoading(false)
      }
    },
  }
}

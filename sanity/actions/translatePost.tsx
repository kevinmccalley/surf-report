import { useState } from 'react'
import type { DocumentActionProps } from 'sanity'

type State = 'idle' | 'loading' | 'done' | 'error'

const LABELS: Record<State, string> = {
  idle:    'Translate to all languages',
  loading: 'Translating…',
  done:    'Translations saved ✓',
  error:   'Translation failed — retry?',
}

export function TranslatePostAction({ id, type, published }: DocumentActionProps) {
  const [state, setState] = useState<State>('idle')

  if (type !== 'post') return null

  const isPublished = Boolean(published)

  return {
    label:    LABELS[state],
    disabled: !isPublished || state === 'loading',
    title:    isPublished
      ? 'Translate this post to Spanish, French, and Portuguese via Claude'
      : 'Publish the post first, then translate',
    onHandle: async () => {
      setState('loading')
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(err.error ?? res.statusText)
        }
        setState('done')
        setTimeout(() => setState('idle'), 4000)
      } catch (err) {
        console.error('[TranslatePostAction]', err)
        setState('error')
        setTimeout(() => setState('idle'), 5000)
      }
    },
  }
}

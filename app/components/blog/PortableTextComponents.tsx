'use client'

import type { PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import { urlFor } from '@/app/lib/sanity'

export const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-10 mb-4 text-[var(--color-text-primary)]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-8 mb-3 text-[var(--color-text-primary)]">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold mt-6 mb-2 text-[var(--color-text-primary)]">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-sky-400 pl-5 my-6 italic text-[var(--color-text-secondary)] text-lg">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mb-5 leading-relaxed text-[var(--color-text-primary)]">{children}</p>
    ),
  },

  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => (
      <code className="bg-[var(--color-surface)] rounded px-1.5 py-0.5 text-sm font-mono text-sky-400">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const isExternal = value?.href?.startsWith('http')
      return (
        <a
          href={value?.href}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-sky-400 underline underline-offset-2 hover:text-sky-300 transition-colors"
        >
          {children}
        </a>
      )
    },
  },

  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      const src = urlFor(value.asset).width(900).auto('format').quality(85).url()
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src={src}
              alt={value.alt ?? ''}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },

    codeBlock: ({ value }) => (
      <div className="my-6">
        {value.filename && (
          <div className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] text-xs font-mono px-4 py-2 rounded-t-lg border-b border-[var(--color-border)]">
            {value.filename}
          </div>
        )}
        <pre
          className={`bg-[var(--color-surface)] text-sm font-mono p-4 overflow-x-auto ${value.filename ? 'rounded-b-lg' : 'rounded-lg'}`}
        >
          <code className={`language-${value.language ?? 'text'} text-[var(--color-text-primary)]`}>
            {value.code}
          </code>
        </pre>
      </div>
    ),

    callout: ({ value }) => {
      const styles: Record<string, { icon: string; className: string }> = {
        info:      { icon: 'ℹ️', className: 'bg-blue-950/40 border-blue-500/40 text-blue-200' },
        tip:       { icon: '💡', className: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' },
        warning:   { icon: '⚠️', className: 'bg-amber-950/40 border-amber-500/40 text-amber-200' },
        important: { icon: '🔴', className: 'bg-red-950/40 border-red-500/40 text-red-200' },
      }
      const s = styles[value.type] ?? styles.info
      return (
        <aside
          role="note"
          className={`my-6 flex gap-3 rounded-lg border p-4 text-sm leading-relaxed ${s.className}`}
        >
          <span aria-hidden="true" className="text-lg shrink-0">{s.icon}</span>
          <p className="m-0">{value.content}</p>
        </aside>
      )
    },
  },
}

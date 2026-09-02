'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Static placeholder rendered (and space-reserving) until the real content mounts. */
  placeholder?: ReactNode
  /**
   * 'idle'    — mount on the next free main-thread slot (requestIdleCallback), so it
   *             doesn't compete with content mounting in the same tick.
   * 'visible' — mount once the element scrolls near the viewport (IntersectionObserver).
   */
  strategy?: 'idle' | 'visible'
  /** IntersectionObserver rootMargin, only used for the 'visible' strategy. */
  rootMargin?: string
}

/**
 * Defers mounting an expensive child (e.g. a Recharts chart) so several such
 * children don't all hydrate together in one main-thread burst. Reserves
 * `placeholder`'s footprint so swapping in the real content doesn't shift layout.
 */
export default function DeferredMount({ children, placeholder, strategy = 'visible', rootMargin = '500px 0px' }: Props) {
  const [shouldRender, setShouldRender] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldRender) return

    if (strategy === 'idle') {
      if (typeof window === 'undefined') return
      const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 } as IdleDeadline), 1))
      const cric = window.cancelIdleCallback ?? window.clearTimeout
      const handle = ric(() => setShouldRender(true), { timeout: 1500 })
      return () => cric(handle)
    }

    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldRender, strategy, rootMargin])

  if (shouldRender) return <>{children}</>
  return <div ref={ref}>{placeholder}</div>
}

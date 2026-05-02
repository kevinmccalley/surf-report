'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME, LS_THEME_KEY, THEMES } from '@/app/lib/themes'

interface ThemeCtx { themeId: string; setTheme: (id: string) => void }
const Ctx = createContext<ThemeCtx>({ themeId: DEFAULT_THEME, setTheme: () => {} })

export function useTheme() { return useContext(Ctx) }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME)

  // Read persisted theme on mount (client only)
  useEffect(() => {
    const saved = localStorage.getItem(LS_THEME_KEY)
    if (saved && THEMES.some(t => t.id === saved)) apply(saved)
  }, [])

  function apply(id: string) {
    setThemeId(id)
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem(LS_THEME_KEY, id)
  }

  // Apply current theme immediately on mount (avoids flash)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
  }, [themeId])

  return (
    <Ctx.Provider value={{ themeId, setTheme: apply }}>
      {children}
    </Ctx.Provider>
  )
}

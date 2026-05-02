export interface Theme {
  id: string
  name: string
  dark: boolean
  preview: [string, string, string] // [bg-start, bg-end, accent]
}

export const THEMES: Theme[] = [
  { id: 'ocean',       name: 'Ocean',       dark: true,  preview: ['#020917', '#0d2040', '#0ea5e9'] },
  { id: 'sunset',      name: 'Sunset',      dark: true,  preview: ['#180a03', '#3d1c0a', '#f97316'] },
  { id: 'forest',      name: 'Forest',      dark: true,  preview: ['#020d04', '#0b200f', '#22c55e'] },
  { id: 'sand',        name: 'Sand',        dark: true,  preview: ['#120f05', '#28210c', '#d97706'] },
  { id: 'light-ocean', name: 'Light Ocean', dark: false, preview: ['#f0f9ff', '#bae6fd', '#0284c7'] },
  { id: 'light-sand',  name: 'Light Sand',  dark: false, preview: ['#fffbeb', '#fde68a', '#b45309'] },
]

export const DEFAULT_THEME = 'ocean'
export const LS_THEME_KEY  = 'gs_theme'

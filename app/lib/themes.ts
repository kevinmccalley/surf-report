export interface Theme {
  id: string
  name: string
  dark: boolean
  preview: [string, string, string] // [bg-start, bg-end, accent]
}

export const THEMES: Theme[] = [
  { id: 'ocean',       name: 'Ocean',       dark: true,  preview: ['#020917', '#0d2040', '#1e6fa5'] },
  { id: 'sunset',      name: 'Sunset',      dark: true,  preview: ['#180a03', '#3d1c0a', '#c2410c'] },
  { id: 'forest',      name: 'Kelp',        dark: true,  preview: ['#020d04', '#0b200f', '#166534'] },
  { id: 'sand',        name: 'Sand',        dark: true,  preview: ['#120f05', '#28210c', '#c49a2e'] },
  { id: 'light-ocean', name: 'Light Ocean', dark: false, preview: ['#f0f9ff', '#bae6fd', '#06b6d4'] },
  { id: 'light-sand',  name: 'Light Sand',  dark: false, preview: ['#fffbeb', '#fde68a', '#f59e0b'] },
]

export const DEFAULT_THEME = 'ocean'
export const LS_THEME_KEY  = 'gs_theme'

export interface Theme {
  id: string
  name: string
  dark: boolean
  preview: [string, string, string] // [bg-start, bg-end, accent]
}

export const THEMES: Theme[] = [
  { id: 'ocean',       name: 'Ocean',       dark: true,  preview: ['#020917', '#0d2040', '#0c4a6e'] },
  { id: 'sunset',      name: 'Rust',        dark: true,  preview: ['#180a03', '#3d1c0a', '#7c2d12'] },
  { id: 'forest',      name: 'Kelp',        dark: true,  preview: ['#020d04', '#0b200f', '#14532d'] },
  { id: 'sand',        name: 'Sand',        dark: true,  preview: ['#120f05', '#28210c', '#78350f'] },
  { id: 'light-ocean', name: 'Sky',         dark: false, preview: ['#f0f9ff', '#bae6fd', '#e0f2fe'] },
  { id: 'light-sand',  name: 'Straw',       dark: false, preview: ['#fffbeb', '#fde68a', '#fef3c7'] },
  { id: 'black',       name: 'Black',       dark: true,  preview: ['#000000', '#111111', '#000000'] },
  { id: 'light-white', name: 'White',       dark: false, preview: ['#ffffff', '#f9fafb', '#ffffff'] },
]

export const DEFAULT_THEME = 'ocean'
export const LS_THEME_KEY  = 'gs_theme'

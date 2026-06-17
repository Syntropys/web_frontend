import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'agrolytics-theme-v3'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useThemeStore = create<{
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}>()(
  persist(
    (set, get) => ({
      theme: readTheme(),
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)

// Apply on module load (before React renders — anti-hydration flash)
if (typeof window !== 'undefined') {
  applyTheme(readTheme())
}

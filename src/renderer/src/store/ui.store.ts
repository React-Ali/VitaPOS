import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark'
  themeColor: 'emerald' | 'blue' | 'purple' | 'rose' | 'orange'
  toggleTheme: () => void
  setThemeColor: (color: 'emerald' | 'blue' | 'purple' | 'rose' | 'orange') => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      themeColor: 'emerald',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setThemeColor: (color) => set({ themeColor: color })
    }),
    { name: 'nms-ui' }
  )
)
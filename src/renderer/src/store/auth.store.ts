import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  full_name: string
  role: 'admin' | 'pharmacist' | 'cashier'
}

interface AuthState {
  user: User | null
  token: string | null
  setSession: (user: User, token: string) => void
  clear: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      clear: () => set({ user: null, token: null })
    }),
    { name: 'nms-auth' }
  )
)
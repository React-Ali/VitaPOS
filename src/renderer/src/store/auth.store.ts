import { create } from 'zustand'

interface User {
  id: number
  username: string
  full_name: string
  role: 'admin' | 'pharmacist' | 'cashier'
}

interface AuthState {
  user: User | null
  token: string | null
  lastActivity: number
  setSession: (user: User, token: string) => void
  updateActivity: () => void
  clear: () => void
}

// Removed 'persist' middleware. This forces a fresh login every time the app opens.
export const useAuth = create<AuthState>()((set) => ({
  user: null,
  token: null,
  lastActivity: Date.now(),
  setSession: (user, token) => set({ user, token, lastActivity: Date.now() }),
  updateActivity: () => set({ lastActivity: Date.now() }),
  clear: () => set({ user: null, token: null })
}))
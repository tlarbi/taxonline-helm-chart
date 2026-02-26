import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) throw new Error('Invalid credentials')
        const data = await res.json()
        set({ user: data.user, token: data.access_token, isAuthenticated: true })
        localStorage.setItem('token', data.access_token)
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('token')
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)

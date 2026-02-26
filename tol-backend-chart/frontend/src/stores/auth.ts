import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'editor' | 'viewer'
}

interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: () => boolean
  isEditor: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (username, password) => {
        const res = await authApi.login(username, password)
        const { access_token, user } = res.data
        localStorage.setItem('access_token', access_token)
        set({ user, token: access_token })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null })
      },

      isAdmin: () => get().user?.role === 'admin',
      isEditor: () => ['admin', 'editor'].includes(get().user?.role ?? ''),
    }),
    { name: 'taxonline-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)

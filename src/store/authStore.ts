'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/lib/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: {
    email: string
    username: string
    password: string
    firstName?: string
    lastName?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            set({ isLoading: false, error: data.error || 'Login failed' })
            return { success: false, error: data.error || 'Login failed' }
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      signup: async (data) => {
        try {
          set({ isLoading: true, error: null })

          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!response.ok) {
            set({ isLoading: false, error: result.error || 'Signup failed' })
            return { success: false, error: result.error || 'Signup failed' }
          }

          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
        } catch (error) {
          // Clear state even if API call fails
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      checkSession: async () => {
        try {
          set({ isLoading: true })

          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
          })

          const data = await response.json()

          if (data.isAuthenticated && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

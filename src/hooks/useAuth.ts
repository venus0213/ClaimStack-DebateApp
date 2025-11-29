'use client'

import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const {
    user,
    isLoading: loading,
    isAuthenticated,
    login,
    logout,
    checkSession,
  } = useAuthStore()

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkSession,
  }
}


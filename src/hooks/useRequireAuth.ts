'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore()
  const { openModal } = useUIStore()
  const router = useRouter()

  const requireAuth = (action?: () => void): boolean => {
    if (!isAuthenticated) {
      openModal('loginRequired')
      return false
    }
    if (action) {
      action()
    }
    return true
  }

  return { requireAuth, isAuthenticated }
}

export function useProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  const { openModal } = useUIStore()

  const canAccess = (route: string): boolean => {
    if (route === '/' || route.startsWith('/login') || route.startsWith('/signup') || route.startsWith('/forgot-password') || route.startsWith('/reset-password')) {
      return true
    }

    const protectedRoutes = ['/browse', '/claims', '/profile', '/moderation']
    const isProtected = protectedRoutes.some((r) => route.startsWith(r))

    if (isProtected && !isAuthenticated) {
      openModal('loginRequired')
      return false
    }

    return true
  }

  return { canAccess, isAuthenticated }
}


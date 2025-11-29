'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

const publicRoutes = ['/']
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) {
      return
    }

    const isPublicRoute = publicRoutes.some((route) => pathname === route)
    const isAuthRoute = authRoutes.some((route) => pathname?.startsWith(route))

    if (!isAuthenticated && !isPublicRoute && !isAuthRoute) {
      router.replace('/')
    }
  }, [pathname, isAuthenticated, isLoading, router])

  if (!isLoading && !isAuthenticated) {
    const isPublicRoute = publicRoutes.some((route) => pathname === route)
    const isAuthRoute = authRoutes.some((route) => pathname?.startsWith(route))
    if (!isPublicRoute && !isAuthRoute) {
      return null
    }
  }

  return <>{children}</>
}


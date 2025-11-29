'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GoogleIcon } from '@/components/ui/Icons'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const { addToast } = useUIStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/browse'
      router.push(redirect)
    }
  }, [isAuthenticated, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'The field cannot be empty.'
    }
    if (!formData.password) {
      newErrors.password = 'The field cannot be empty.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const result = await login(formData.email, formData.password)

    if (result.success) {
      addToast('Successfully logged in!', 'success')
      const redirect = searchParams.get('redirect') || '/browse'
      router.push(redirect)
    } else {
      setErrors({ general: result.error || 'Login failed' })
      addToast(result.error || 'Login failed', 'error')
    }
  }

  return (
    <div className="min-h-screen flex w-full max-w-[1440px] mx-auto">
      {/* Left Side - Artwork */}
      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-gray-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/login.png"
            alt="ClaimStack - Debate Platform"
            fill
            className="object-contain"
            priority
            quality={90}
            sizes="66vw"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/3 flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Logo - Top Center of Right Side */}
        <div className="flex justify-center pt-12 lg:pt-20">
          <div className="flex items-center space-x-2">
            <span className="text-base font-semibold text-gray-900">ClaimStack</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 text-center">Log In</h1>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Input
              placeholder="Email/ Username"
              className='rounded-full'
              type="text"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setErrors({ ...errors, email: '' })
              }}
              error={errors.email}
            />

            <Input
              placeholder="Password"
              className='rounded-full'
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setErrors({ ...errors, password: '' })
              }}
              error={errors.password}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 rounded-full text-base"
              >
                <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sign In With Google</span>
              </Button>
            </div>
            {errors.general && (
              <div className="text-center text-sm text-red-600">
                {errors.general}
              </div>
            )}
            <div className="flex justify-center items-center pt-12 lg:pt-20">
              <Button type="submit" variant="primary" className="w-full rounded-full text-white text-base" isLoading={isLoading}>
                Log In
              </Button>
            </div>

            <div className="text-center text-xs sm:text-sm flex justify-center flex-row gap-2 flex-wrap">
              <div>
                Forgot password?
              </div>
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
                Restore
              </Link>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}


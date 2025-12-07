'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const { addToast } = useUIStore()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    setToken(tokenParam)
    setEmail(emailParam)
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/browse')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!token || !email) {
      // setErrors({ general: 'Invalid reset link. Please request a new password reset.' })
    }
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!token || !email) {
      // newErrors.general = 'Invalid reset link. Please request a new password reset.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setIsSuccess(true)
      addToast('Password reset successfully! You can now log in.', 'success')

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setErrors({ general: errorMessage })
      addToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
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

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/3 flex flex-col p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center pt-12 lg:pt-20">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="ClaimStack Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">ClaimStack</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 text-center">Reset Password</h1>
              <p className="text-sm text-gray-600 text-center mt-2">
                Enter your new password below.
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 text-center">
                    Password reset successfully! Redirecting to login...
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm">
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <Input
                  placeholder="New Password"
                  className="rounded-full"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setErrors({ ...errors, password: '' })
                  }}
                  error={errors.password}
                />

                <Input
                  placeholder="Confirm New Password"
                  className="rounded-full"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    setErrors({ ...errors, confirmPassword: '' })
                  }}
                  error={errors.confirmPassword}
                />

                {errors.general && (
                  <div className="text-center text-sm text-red-600">
                    {errors.general}
                  </div>
                )}

                <div className="flex justify-center items-center pt-12 lg:pt-20">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full rounded-full bg-[#030303] hover:bg-gray-800 text-white text-base"
                    isLoading={isLoading}
                  >
                    Reset Password
                  </Button>
                </div>

                <div className="text-center text-xs sm:text-sm">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


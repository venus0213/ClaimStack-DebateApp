'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { addToast } = useUIStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/browse')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Failed to verify email')
      }

      if (!checkData.exists) {
        setError('No account found with this email address. Please check your email and try again.')
        addToast('No account found with this email address.', 'error')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsSuccess(true)
      addToast('Password reset email sent! Check your inbox.', 'success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(errorMessage)
      addToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full max-w-[1440px] mx-auto bg-white dark:bg-gray-900 transition-colors">
      {/* Left Side - Artwork */}
      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden bg-gray-50 dark:bg-gray-800">
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

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/3 flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Logo - Top Center of Right Side */}
        <div className="flex justify-center pt-12 lg:pt-20">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="ClaimStack Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">ClaimStack</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">Forgot Password?</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 text-center">
                    If an account with that email exists, we have sent a password reset link. Please check your inbox and follow the instructions.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <Input
                  placeholder="Email"
                  className="rounded-full"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  // error={error}
                />

                {error && (
                  <div className="text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex justify-center items-center pt-12 lg:pt-20">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full rounded-full bg-[#030303] dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 text-base transition-colors"
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>

                <div className="text-center text-xs sm:text-sm">
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
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


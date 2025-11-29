'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GoogleIcon } from '@/components/ui/Icons'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export default function SignupPage() {
  const router = useRouter()
  const { signup, isAuthenticated, isLoading, clearError } = useAuthStore()
  const { addToast } = useUIStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/browse')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) newErrors.firstName = 'The field cannot be empty.'
    if (!formData.lastName) newErrors.lastName = 'The field cannot be empty.'
    if (!formData.username) newErrors.username = 'The field cannot be empty.'
    if (!formData.email) newErrors.email = 'The field cannot be empty.'
    if (!formData.password) newErrors.password = 'The field cannot be empty.'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.'
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const result = await signup({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    })

    if (result.success) {
      addToast('Account created successfully!', 'success')
      router.push('/browse')
    } else {
      setErrors({ general: result.error || 'Signup failed' })
      addToast(result.error || 'Signup failed', 'error')
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

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/3 flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Logo - Top Center of Right Side */}
        <div className="flex justify-center pt-6 sm:pt-10 lg:pt-14">
          <div className="flex items-center space-x-2">
            <span className="text-sm sm:text-base font-semibold text-gray-900">ClaimStack</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">Sign Up</h1>
            </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Input
              placeholder="First Name"
              className='rounded-full'
              type="text"
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value })
                setErrors({ ...errors, firstName: '' })
              }}
              error={errors.firstName}
            />

            <Input
              placeholder="Last Name"
              className='rounded-full'
              type="text"
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value })
                setErrors({ ...errors, lastName: '' })
              }}
              error={errors.lastName}
            />

            <Input
              placeholder="Username"
              className='rounded-full'
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value })
                setErrors({ ...errors, username: '' })
              }}
              error={errors.username}
            />

            <Input
              placeholder="Email"
              className='rounded-full'
              type="email"
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
                className="w-full flex items-center justify-center space-x-2 rounded-full text-sm sm:text-base"
              >
                <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sign Up With Google</span>
              </Button>
            </div>

            <div className="flex justify-center items-start">
              <div className="w-full flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeToTerms: e.target.checked })
                    setErrors({ ...errors, agreeToTerms: '' })
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                />
                <label htmlFor="agreeToTerms" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
            {errors.agreeToTerms && (
              <div className="flex justify-center">
                <p className="w-full text-sm text-red-600">{errors.agreeToTerms}</p>
              </div>
            )}
            {errors.general && (
              <div className="text-center text-sm text-red-600">
                {errors.general}
              </div>
            )}

            <div className="flex justify-center items-center pt-8 sm:pt-12 lg:pt-14">
              <Button type="submit" variant="primary" className="w-full rounded-full text-white text-sm sm:text-base" isLoading={isLoading}>
                Sign Up
              </Button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}


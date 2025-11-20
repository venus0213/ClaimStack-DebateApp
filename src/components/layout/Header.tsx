'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MenuIcon } from '@/components/ui/Icons'
import { Modal } from '@/components/ui/Modal'
import { SubmitClaimForm } from '@/components/claims/SubmitClaimForm'
import { useAuth } from '@/hooks/useAuth'

export const Header: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  
  const isBrowseActive = pathname?.startsWith('/browse')
  const isModerationActive = pathname?.startsWith('/moderation')
  const avatarUrl = user?.avatarUrl || '/icons/user.png'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-semibold text-gray-900">ClaimstackAI</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 lg:pl-5">
              <Link
                href="/browse"
                className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isBrowseActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse The Claims
              </Link>
              <Link
                href="/moderation"
                className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isModerationActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Moderation Pannel
              </Link>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              className="hidden sm:inline-flex text-xs sm:text-sm px-3 sm:px-4"
            >
              Submit Claim
            </Button>
            
            <NotificationBell />
            
            {/* User Avatar */}
            <Link href="/profile" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-blue-500 flex items-center justify-center overflow-hidden">
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setIsSubmitModalOpen(true)
                  setIsMenuOpen(false)
                }}
                className="mx-4"
              >
                Submit Claim
              </Button>
              <Link
                href="/browse"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                  isBrowseActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse The Claims
              </Link>
              <Link
                href="/moderation"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                  isModerationActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Moderation Pannel
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Submit Claim Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit A Claim"
        size="lg"
      >
        <SubmitClaimForm
          isModal
          onCancel={() => setIsSubmitModalOpen(false)}
          onSuccess={() => {
            setIsSubmitModalOpen(false)
            router.push('/browse')
          }}
        />
      </Modal>
    </header>
  )
}


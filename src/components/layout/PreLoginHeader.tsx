'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { MenuIcon, XIcon } from '@/components/ui/Icons'
import { ProtectedLink } from '@/components/ui/ProtectedLink'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Modal } from '@/components/ui/Modal'
import { SubmitClaimForm } from '@/components/claims/SubmitClaimForm'
import { useAuth } from '@/hooks/useAuth'

const categories = [
  'Animals & Nature',
  'Entertainment & Pop Culture',
  'Law & Justice',
  'Religion & Spirituality',
  'Art & Literature',
  'Environment',
  'Parenting & Family',
  'Science & Technology',
  'Business & Finance',
  'Fashion & Lifestyle',
  'Philosophy & Ethics',
  'Self-Improvement',
  'Consumer Products',
  'Food & Nutrition',
  'Politics',
  'Social Issues',
  'Economics',
  'Health & Wellness',
  'Psychology & Behavior',
  'Sports',
  'Education',
  'History',
  'Relationships',
  'Travel & Culture',
]

export const PreLoginHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isCategoriesHovered, setIsCategoriesHovered] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const avatarUrl = user?.avatarUrl || '/icons/user.png'

  return (
    <header className="w-full bg-[#eef4ff] z-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-14">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Side - Logo and Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Claimstack</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12 xl:pl-8">
              <div
                className="relative"
                onMouseEnter={() => setIsCategoriesHovered(true)}
                onMouseLeave={() => setIsCategoriesHovered(false)}
              >
                <button
                  type="button"
                  className={`px-4 xl:px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    isCategoriesHovered
                      ? 'text-blue-600 bg-blue-50 border border-blue-600'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                >
                  Categories
                </button>

                {/* Desktop Categories Dropdown */}
                {isCategoriesHovered && (
                  <div className="absolute top-full left-0 mt-2 w-[600px] xl:w-[900px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 xl:p-6 z-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 xl:gap-x-6 gap-y-3">
                      {categories.map((category) => (
                        <ProtectedLink
                          key={category}
                          href={`/browse?category=${encodeURIComponent(category)}`}
                          className={`px-4 xl:px-6 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                            hoveredCategory === category
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onMouseEnter={() => setHoveredCategory(category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          {category}
                        </ProtectedLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <ProtectedLink
                href="/browse?sort=trending"
                className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
              >
                Trending
              </ProtectedLink>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {isAuthenticated ? (
              <>
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
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <XIcon className="w-6 h-6" />
                  ) : (
                    <MenuIcon className="w-6 h-6" />
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Log In
                </Link>
                <Button variant="primary" size="sm" className="hidden sm:inline-flex" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <XIcon className="w-6 h-6" />
                  ) : (
                    <MenuIcon className="w-6 h-6" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                className="flex items-center justify-between px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <span>Categories</span>
                <svg
                  className={`w-5 h-5 transition-transform ${isMobileCategoriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isMobileCategoriesOpen && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <ProtectedLink
                        key={category}
                        href={`/browse?category=${encodeURIComponent(category)}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsMobileCategoriesOpen(false)
                        }}
                        className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {category}
                      </ProtectedLink>
                    ))}
                  </div>
                </div>
              )}

              <ProtectedLink
                href="/browse?sort=trending"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Trending
              </ProtectedLink>
              
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => {
                      setIsSubmitModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="mx-4"
                  >
                    Submit Claim
                  </Button>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Log In
                  </Link>
                  
                  <Button variant="primary" size="sm" className="mx-4" asChild>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Submit Claim Modal - Only shown when authenticated */}
      {isAuthenticated && (
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
      )}
    </header>
  )
}


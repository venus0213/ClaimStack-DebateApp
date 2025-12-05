'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const isUserManagementActive = pathname?.startsWith('/admin/users')
  const isContentManagementActive = pathname?.startsWith('/admin/content')
  const avatarUrl = user?.avatarUrl || '/icons/user.png'
  
  // Check if user is ADMIN or MODERATOR (can see admin features)
  const userRole = user?.role?.toUpperCase()
  const isAdmin = userRole === 'ADMIN'
  const isModerator = userRole === 'MODERATOR'
  const canAccessAdminFeatures = isAdmin || isModerator

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/logo.png"
                alt="ClaimStack Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">ClaimStack</span>
            </Link>

            {/* Navigation Links */}
            {canAccessAdminFeatures && (
              <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 lg:pl-5">
                <Link
                  href="/browse"
                  className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isBrowseActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Browse Claims
                </Link>
                {isAdmin && (
                  <Link
                    href="/moderation"
                    className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isModerationActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Moderation Pannel
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isUserManagementActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    User Management Panel
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/content"
                    className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isContentManagementActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Content Management
                  </Link>
                )}
              </nav>
            )}
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
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              aria-label="Toggle menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
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
              {canAccessAdminFeatures && (
                <>
                  <Link
                    href="/browse"
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                      isBrowseActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Browse Claims
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/moderation"
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        isModerationActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Moderation Pannel
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        isUserManagementActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      User Management Panel
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin/content"
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        isContentManagementActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Content Management
                    </Link>
                  )}
                </>
              )}
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


'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContentCard } from '@/components/content/ContentCard'
import { Claim, User } from '@/lib/types'
import { ChevronLeftIcon, EditIcon, LogoutIcon } from '@/components/ui/Icons'
import { useAuth } from '@/hooks/useAuth'
import { ProfileEditModal } from '@/components/profile/ProfileEditModal'

const profileButtons = [
  { id: 'saved', label: 'Saved' },
  { id: 'claims', label: 'Claims' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'following', label: 'Following' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('claims')
  const { user, loading: authLoading, logout: logoutUser, checkSession } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch user's claims
  useEffect(() => {
    const fetchClaims = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          userId: user.id,
          sortBy: 'newest',
          limit: '100', // Fetch all user's claims
        })

        const response = await fetch(`/api/claims?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch claims')
        }

        const data = await response.json()
        if (data.success) {
          setClaims(data.claims || [])
        } else {
          throw new Error(data.error || 'Failed to fetch claims')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setClaims([])
      } finally {
        setLoading(false)
      }
    }

    fetchClaims()
  }, [user?.id])

  const logout = async () => {
    try {
      await logoutUser()
      // Redirect to login page after logout
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if logout fails
      router.push('/login')
    }
  }

  const handleProfileUpdate = async (updatedUser: User) => {
    // Refresh the session to get updated user data
    await checkSession()
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username
  const avatarUrl = user.avatarUrl || '/icons/user.png'

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link
            href="/browse"
            className="inline-flex text-base sm:text-lg lg:text-xl items-center font-semibold text-[#030303] hover:text-gray-900"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-3 sm:mr-6" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
              <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Logout</span>
              <LogoutIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 sm:border-4 border-white shadow-lg flex-shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {displayName}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">@{user.username}</p>
              {user.bio && (
                <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {profileButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveTab(button.id)}
                className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === button.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'claims' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading claims...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600">Error: {error}</div>
              </div>
            ) : claims.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No claims yet</p>
                  <Link
                    href="/create"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Create your first claim
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {claims.map((claim) => (
                  <ContentCard key={claim.id} item={claim} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'claims' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Coming soon: {profileButtons.find(b => b.id === activeTab)?.label}</div>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {user && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}


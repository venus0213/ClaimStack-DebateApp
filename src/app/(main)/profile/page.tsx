'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContentCard } from '@/components/content/ContentCard'
import { Claim, Evidence, Perspective, User } from '@/lib/types'
import { ChevronLeftIcon, EditIcon, LogoutIcon, SunIcon, MoonIcon } from '@/components/ui/Icons'
import { useAuth } from '@/hooks/useAuth'
import { ProfileEditModal } from '@/components/profile/ProfileEditModal'
import { useTheme } from '@/components/providers/ThemeProvider'
import { UserListModal } from '@/components/users/UserListModal'
import { EditClaimModal } from '@/components/claims/EditClaimModal'

const profileButtons = [
  // { id: 'saved', label: 'Saved' },
  { id: 'claims', label: 'My Claims' },
  { id: 'evidence', label: 'My Evidence & Perspective' },
  { id: 'following', label: 'My Recommended' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('claims')
  const { user, loading: authLoading, logout: logoutUser, checkSession } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [claims, setClaims] = useState<Claim[]>([])
  const [evidenceAndPerspectives, setEvidenceAndPerspectives] = useState<(Evidence | Perspective)[]>([])
  const [upvotedClaims, setUpvotedClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [claimToEdit, setClaimToEdit] = useState<Claim | null>(null)

  // Fetch user's claims (all statuses: pending, rejected, approved)
  const fetchUserClaims = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch all claims for the user (no status filter to get pending, rejected, and approved)
      const claimsParams = new URLSearchParams({
        userId: user.id,
        sortBy: 'newest',
        limit: '100',
      })
      const claimsResponse = await fetch(`/api/claims?${claimsParams.toString()}`, {
        credentials: 'include',
      })

      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json()
        if (claimsData.success && claimsData.claims) {
          // Sort by creation date (most recent first)
          const sortedClaims = [...claimsData.claims].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA
          })
          setClaims(sortedClaims)
        } else {
          setClaims([])
        }
      } else {
        throw new Error('Failed to fetch claims')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's evidence and perspectives (all statuses: pending, rejected, approved)
  const fetchUserEvidenceAndPerspectives = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch evidence
      const evidenceParams = new URLSearchParams({
        userId: user.id,
      })
      const evidenceResponse = await fetch(`/api/evidence?${evidenceParams.toString()}`, {
        credentials: 'include',
      })
      
      // Fetch perspectives
      const perspectivesParams = new URLSearchParams({
        userId: user.id,
      })
      const perspectivesResponse = await fetch(`/api/perspectives?${perspectivesParams.toString()}`, {
        credentials: 'include',
      })

      const allItems: (Evidence | Perspective)[] = []

      // Process evidence
      if (evidenceResponse.ok) {
        const evidenceData = await evidenceResponse.json()
        if (evidenceData.success && evidenceData.evidence) {
          allItems.push(...evidenceData.evidence)
        }
      }

      // Process perspectives
      if (perspectivesResponse.ok) {
        const perspectivesData = await perspectivesResponse.json()
        if (perspectivesData.success && perspectivesData.perspectives) {
          allItems.push(...perspectivesData.perspectives)
        }
      }

      // Sort by creation date (most recent first)
      allItems.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })

      setEvidenceAndPerspectives(allItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setEvidenceAndPerspectives([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch claims that the user has upvoted (from other users)
  const fetchUpvotedClaims = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch claims upvoted by the current user (excluding their own claims)
      const claimsParams = new URLSearchParams({
        upvotedBy: 'me',
        sortBy: 'newest',
        limit: '100',
      })
      const claimsResponse = await fetch(`/api/claims?${claimsParams.toString()}`, {
        credentials: 'include',
      })

      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json()
        if (claimsData.success && claimsData.claims) {
          // Sort by creation date (most recent first)
          const sortedClaims = [...claimsData.claims].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA
          })
          setUpvotedClaims(sortedClaims)
        } else {
          setUpvotedClaims([])
        }
      } else {
        throw new Error('Failed to fetch upvoted claims')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUpvotedClaims([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch follower and following counts
  const fetchFollowCounts = async () => {
    if (!user?.id) return

    try {
      // Fetch followers count (countOnly query parameter for efficiency)
      const followersResponse = await fetch(`/api/users/${user.id}/followers?countOnly=true`, {
        credentials: 'include',
      })
      if (followersResponse.ok) {
        const followersData = await followersResponse.json()
        if (followersData.success) {
          setFollowersCount(followersData.count || 0)
        }
      }

      // Fetch following count (countOnly query parameter for efficiency)
      const followingResponse = await fetch(`/api/users/${user.id}/following?countOnly=true`, {
        credentials: 'include',
      })
      if (followingResponse.ok) {
        const followingData = await followingResponse.json()
        if (followingData.success) {
          setFollowingCount(followingData.count || 0)
        }
      }
    } catch (err) {
      console.error('Error fetching follow counts:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'claims') {
      fetchUserClaims()
    } else if (activeTab === 'evidence') {
      fetchUserEvidenceAndPerspectives()
    } else if (activeTab === 'following') {
      fetchUpvotedClaims()
    }
  }, [user?.id, activeTab])

  useEffect(() => {
    if (user?.id) {
      fetchFollowCounts()
    }
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
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center transition-colors">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view your profile</p>
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link
            href="/browse"
            className="inline-flex text-base sm:text-lg lg:text-xl items-center font-semibold text-[#030303] dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeftIcon className="w-7 h-7 mr-3 sm:mr-6" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 cursor-pointer transition-colors shadow-sm"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <>
                  <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                  <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Dark Mode</span>
                </>
              ) : (
                <>
                  <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Light Mode</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
              <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {displayName}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">@{user.username}</p>
              {user.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.bio}</p>
              )}
              {/* Follower and Following counts */}
              <div className="flex items-center gap-4 sm:gap-6 mt-3">
                <button
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                    {followersCount}
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {followersCount === 1 ? 'follower' : 'followers'}
                  </span>
                </button>
                <button
                  onClick={() => setIsFollowingModalOpen(true)}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                    {followingCount}
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    following
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto sm:overflow-visible scrollbar-hide scroll-smooth">
            <div className="flex flex-nowrap sm:flex-wrap gap-2 sm:gap-4 min-w-max sm:min-w-0">
            {profileButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveTab(button.id)}
                  className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === button.id
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {button.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'claims' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading claims...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : claims.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No claims yet</p>
                  <Link
                    href="/create"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Create your first claim
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {claims.map((claim) => (
                  <ContentCard 
                    key={claim.id}
                    item={claim} 
                    showEdit={true}
                    onEdit={(itemId: string) => {
                      setClaimToEdit(claim)
                      setEditModalOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Evidence and Perspective tab */}
        {activeTab === 'evidence' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading evidence and perspectives...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : evidenceAndPerspectives.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No evidence or perspectives yet</p>
                  <Link
                    href="/browse"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Browse claims to add evidence or perspectives
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {evidenceAndPerspectives.map((item) => {
                  const isEvidence = 'type' in item
                  return (
                    <ContentCard 
                      key={item.id} 
                      item={item} 
                      showDelete={true}
                      onDelete={async (itemId: string, itemType: 'claim' | 'evidence' | 'perspective') => {
                        try {
                          const endpoint = isEvidence 
                            ? `/api/evidence/${itemId}`
                            : `/api/perspectives/${itemId}`
                          
                          const response = await fetch(endpoint, {
                            method: 'DELETE',
                            credentials: 'include',
                          })

                          if (!response.ok) {
                            const data = await response.json()
                            throw new Error(data.error || 'Failed to delete')
                          }

                          // Refresh the list to show updated data
                          await fetchUserEvidenceAndPerspectives()
                        } catch (err) {
                          console.error('Delete error:', err)
                          alert(err instanceof Error ? err.message : 'Failed to delete')
                        }
                      }}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Following tab - shows claims from other users that the current user has upvoted */}
        {activeTab === 'following' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading upvoted claims...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : upvotedClaims.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No upvoted claims yet</p>
                  <Link
                    href="/browse"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Browse claims to upvote
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {upvotedClaims.map((claim) => (
                  <ContentCard 
                    key={claim.id} 
                    item={claim} 
                    showDelete={false}
                  />
                ))}
              </div>
            )}
          </>
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

      {/* Followers Modal */}
      {user && (
        <UserListModal
          isOpen={isFollowersModalOpen}
          onClose={() => setIsFollowersModalOpen(false)}
          userId={user.id}
          type="followers"
          title="Followers"
        />
      )}

      {/* Following Modal */}
      {user && (
        <UserListModal
          isOpen={isFollowingModalOpen}
          onClose={() => setIsFollowingModalOpen(false)}
          userId={user.id}
          type="following"
          title="Following"
        />
      )}

      {/* Edit Claim Modal */}
      {claimToEdit && (
        <EditClaimModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setClaimToEdit(null)
          }}
          onConfirm={async () => {
            // Refresh the list to show updated data
            await fetchUserClaims()
            setEditModalOpen(false)
            setClaimToEdit(null)
          }}
          claimId={claimToEdit.id}
          claim={claimToEdit}
        />
      )}
    </div>
  )
}


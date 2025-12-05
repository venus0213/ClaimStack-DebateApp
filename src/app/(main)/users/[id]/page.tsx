'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ContentCard } from '@/components/content/ContentCard'
import { Claim, Evidence, Perspective, User } from '@/lib/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const profileTabs = [
  { id: 'claims', label: 'Claims' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'perspectives', label: 'Perspectives' },
]

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('claims')
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [perspectives, setPerspectives] = useState<Perspective[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data
  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      if (data.success && data.user) {
        setUser(data.user)
        setIsFollowing(data.isFollowing || false)
      } else {
        throw new Error('User not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's claims
  const fetchUserClaims = async () => {
    if (!userId) return

    try {
      setContentLoading(true)
      
      const claimsParams = new URLSearchParams({
        userId: userId,
        status: 'approved',
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
      console.error('Error fetching claims:', err)
      setClaims([])
    } finally {
      setContentLoading(false)
    }
  }

  // Fetch user's evidence
  const fetchUserEvidence = async () => {
    if (!userId) return

    try {
      setContentLoading(true)
      
      const evidenceParams = new URLSearchParams({
        userId: userId,
      })
      const evidenceResponse = await fetch(`/api/evidence?${evidenceParams.toString()}`, {
        credentials: 'include',
      })

      if (evidenceResponse.ok) {
        const evidenceData = await evidenceResponse.json()
        if (evidenceData.success && evidenceData.evidence) {
          // Filter only approved evidence for public profiles
          const approvedEvidence = evidenceData.evidence.filter((e: Evidence) => e.status === 'approved')
          // Sort by creation date (most recent first)
          const sortedEvidence = [...approvedEvidence].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA
          })
          setEvidence(sortedEvidence)
        } else {
          setEvidence([])
        }
      } else {
        throw new Error('Failed to fetch evidence')
      }
    } catch (err) {
      console.error('Error fetching evidence:', err)
      setEvidence([])
    } finally {
      setContentLoading(false)
    }
  }

  // Fetch user's perspectives
  const fetchUserPerspectives = async () => {
    if (!userId) return

    try {
      setContentLoading(true)
      
      const perspectivesParams = new URLSearchParams({
        userId: userId,
      })
      const perspectivesResponse = await fetch(`/api/perspectives?${perspectivesParams.toString()}`, {
        credentials: 'include',
      })

      if (perspectivesResponse.ok) {
        const perspectivesData = await perspectivesResponse.json()
        if (perspectivesData.success && perspectivesData.perspectives) {
          const approvedPerspectives = perspectivesData.perspectives.filter((p: Perspective) => p.status === 'approved')
          const sortedPerspectives = [...approvedPerspectives].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA
          })
          setPerspectives(sortedPerspectives)
        } else {
          setPerspectives([])
        }
      } else {
        throw new Error('Failed to fetch perspectives')
      }
    } catch (err) {
      console.error('Error fetching perspectives:', err)
      setPerspectives([])
    } finally {
      setContentLoading(false)
    }
  }

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!currentUser) {
      // Redirect to login or show message
      return
    }

    if (isFollowingAction) return

    const previousFollowing = isFollowing
    
    try {
      setIsFollowingAction(true)
      setIsFollowing(!previousFollowing)

      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to follow')
      }

      const data = await response.json()
      if (data.success) {
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      setIsFollowing(previousFollowing)
      console.error('Follow error:', error)
      alert(error instanceof Error ? error.message : 'Failed to follow user')
    } finally {
      setIsFollowingAction(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  useEffect(() => {
    if (userId && user) {
      if (activeTab === 'claims') {
        fetchUserClaims()
      } else if (activeTab === 'evidence') {
        fetchUserEvidence()
      } else if (activeTab === 'perspectives') {
        fetchUserPerspectives()
      }
    }
  }, [userId, user, activeTab])

  if (loading && !user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center transition-colors">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link
            href="/browse"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Go back to Browse
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username
  const avatarUrl = user.avatarUrl || '/icons/user.png'
  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link
            href="/browse"
            className="inline-flex text-base sm:text-lg lg:text-xl items-center font-semibold text-[#030303] dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeftIcon className="w-7 h-7 mr-3 sm:mr-6" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Link>
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
            </div>
          </div>
          {!isOwnProfile && currentUser && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleFollow}
                disabled={isFollowingAction}
                className="text-white rounded-full text-xs sm:text-sm px-3 sm:px-4"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'claims' && (
          <>
            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading claims...</div>
              </div>
            ) : error && claims.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : claims.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No claims yet</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {claims.map((claim) => (
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

        {activeTab === 'evidence' && (
          <>
            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading evidence...</div>
              </div>
            ) : error && evidence.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : evidence.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No evidence yet</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {evidence.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    showDelete={false}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'perspectives' && (
          <>
            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading perspectives...</div>
              </div>
            ) : error && perspectives.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              </div>
            ) : perspectives.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No perspectives yet</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {perspectives.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    showDelete={false}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { SearchIcon, ClockIcon, FlagIcon, QuestionMarkIcon, LinkIcon } from '@/components/ui/Icons'
import { FilterButton } from '@/components/ui/FilterButton'
import { FilterValues } from '@/components/ui/FilterModal'
import { ReviewModal } from '@/components/moderation/ReviewModal'
import { Claim } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'

const sortOptions = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'flagged', label: 'Most Flagged' },
  { id: 'severity', label: 'Severity' },
]

interface ModerationItem {
  id: string
  type: 'claim' | 'evidence'
  user: string
  date: string
  title: string
  flaggedBy: number
  reason: string
  link?: string
  status: 'pending' | 'reviewed'
  claimId?: string
  submittedDate?: string
  ipAddress?: string
  platform?: string
  userStrikeHistory?: string
  votesFor?: number
  votesAgainst?: number
  flagTimestamps?: Array<{ date: string; user: string }>
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  url?: string
}

export default function ModerationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([])
  const [rejectedClaims, setRejectedClaims] = useState<Claim[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [isLoadingRejected, setIsLoadingRejected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterValues | null>(null)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/')
        return
      }
      const userRole = user.role?.toUpperCase()
      if (userRole !== 'ADMIN') {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    return null
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPending(true)
      setIsLoadingRejected(true)
      try {
        const pendingParams = new URLSearchParams()
        pendingParams.append('status', 'pending')
        pendingParams.append('page', '1')
        pendingParams.append('limit', '100')
        pendingParams.append('sortBy', 'newest')
        const pendingResponse = await fetch(`/api/claims?${pendingParams.toString()}`)
        const pendingData = await pendingResponse.json()
        if (pendingResponse.ok) {
          setPendingClaims(pendingData.claims || [])
        }

        const rejectedParams = new URLSearchParams()
        rejectedParams.append('status', 'rejected')
        rejectedParams.append('page', '1')
        rejectedParams.append('limit', '100')
        rejectedParams.append('sortBy', 'newest')
        const rejectedResponse = await fetch(`/api/claims?${rejectedParams.toString()}`)
        const rejectedData = await rejectedResponse.json()
        if (rejectedResponse.ok) {
          setRejectedClaims(rejectedData.claims || [])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch claims'
        setError(errorMessage)
        console.error('Error fetching claims:', err)
      } finally {
        setIsLoadingPending(false)
        setIsLoadingRejected(false)
      }
    }
    fetchData()
  }, [])

  const allClaims = [...pendingClaims, ...rejectedClaims]

  const moderationItems: ModerationItem[] = allClaims.map((claim) => {
      const date = new Date(claim.createdAt)
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      const username = claim.user?.username || 'Unknown'
      const userDisplay = `@${username}`

      return {
        id: claim.id,
        type: 'claim' as const,
        user: userDisplay,
        date: formattedDate,
        title: claim.title,
        flaggedBy: 0,
        reason: claim.status === 'pending' ? 'Pending Review' : 'Rejected',
        link: undefined,
        status: claim.status === 'pending' ? 'pending' as const : 'reviewed' as const,
        claimId: claim.id,
        submittedDate: date.toLocaleString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        }),
        ipAddress: undefined,
        platform: 'Web',
        userStrikeHistory: undefined,
        votesFor: 0,
        votesAgainst: 0,
        flagTimestamps: [],
        fileUrl: claim.fileUrl || undefined,
        fileName: claim.fileName || undefined,
        fileSize: claim.fileSize || undefined,
        fileType: claim.fileType || undefined,
        url: claim.url || undefined,
        description: claim.description || undefined,
        forSummary: claim.forSummary || undefined,
      }
    })

  const filteredItems = moderationItems.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      item.user.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query)
    )
  })

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    console.log('Filters applied:', newFilters)
  }

  const handleReview = (item: ModerationItem) => {
    setSelectedItem(item)
    setIsReviewModalOpen(true)
  }

  const handleApprove = async () => {
    setIsReviewModalOpen(false)
    setSelectedItem(null)
    setIsLoadingPending(true)
    try {
      const pendingParams = new URLSearchParams()
      pendingParams.append('status', 'pending')
      pendingParams.append('page', '1')
      pendingParams.append('limit', '100')
      pendingParams.append('sortBy', 'newest')
      const pendingResponse = await fetch(`/api/claims?${pendingParams.toString()}`)
      const pendingData = await pendingResponse.json()
      if (pendingResponse.ok) {
        setPendingClaims(pendingData.claims || [])
      }
    } catch (err) {
      console.error('Error refreshing claims:', err)
    } finally {
      setIsLoadingPending(false)
    }
  }

  const handleReject = async () => {
    setIsReviewModalOpen(false)
    setSelectedItem(null)
    setIsLoadingPending(true)
    setIsLoadingRejected(true)
    try {
      const [pendingResponse, rejectedResponse] = await Promise.all([
        fetch(`/api/claims?${new URLSearchParams({ status: 'pending', page: '1', limit: '100', sortBy: 'newest' }).toString()}`),
        fetch(`/api/claims?${new URLSearchParams({ status: 'rejected', page: '1', limit: '100', sortBy: 'newest' }).toString()}`)
      ])
      const [pendingData, rejectedData] = await Promise.all([
        pendingResponse.json(),
        rejectedResponse.json()
      ])
      if (pendingResponse.ok) {
        setPendingClaims(pendingData.claims || [])
      }
      if (rejectedResponse.ok) {
        setRejectedClaims(rejectedData.claims || [])
      }
    } catch (err) {
      console.error('Error refreshing claims:', err)
    } finally {
      setIsLoadingPending(false)
      setIsLoadingRejected(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-[46px] font-semibold text-[#030303] dark:text-gray-100">Moderation Pannel</h1>
          <div className="flex-1 max-w-full sm:ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search claims, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`px-3 sm:px-4 py-[6px] rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === option.id
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end sm:justify-start">
            <FilterButton 
              onFiltersChange={handleFiltersChange}
              buttonClassName="text-xs sm:text-sm px-3 sm:px-4"
              iconSize="w-4 h-4 sm:w-5 sm:h-5"
            />
          </div>
        </div>

        {(isLoadingPending || isLoadingRejected) && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading claims...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {!isLoadingPending && !isLoadingRejected && !error && filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No pending or rejected claims to review.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-4 sm:p-6 rounded-lg sm:rounded-[32px]">
              <div className="border-b border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 text-xs font-medium rounded-full">
                    Claim
                  </span>
                  {item.status === 'pending' && (
                    <span className="px-2 sm:px-3 py-1 sm:py-2 bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Pending</span>
                    </span>
                  )}
                  {item.status === 'reviewed' && (
                    <span className="px-2 sm:px-3 py-1 sm:py-2 bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-300 text-xs font-medium rounded-full flex items-center space-x-1">
                      <FlagIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3 sm:mb-4">
                <div className="border-b border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-black dark:text-gray-100">{item.user}</span>
                    <span className="text-xs sm:text-sm text-black dark:text-gray-100">{item.date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2 sm:mb-3">{item.title}</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-3 sm:mb-4 pb-3 sm:pb-4">
                  <span className="flex items-center space-x-1">
                    <FlagIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Flagged by: <strong className="text-[#030303] dark:text-gray-200">{item.flaggedBy} users</strong></span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <QuestionMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Reasons: <strong className="text-[#030303] dark:text-gray-200">{item.reason}</strong></span>
                  </span>
                </div>
                {item.link && (
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-center space-x-1 border-b border-gray-200 dark:border-gray-700 mb-3 sm:mb-4 pb-3 sm:pb-4">
                    <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="break-all">{item.link}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => handleReview(item)}
                className="w-full px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 text-black dark:text-gray-100 text-xs sm:text-sm font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Review Item
              </button>
            </Card>
          ))}
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onApprove={handleApprove}
        onReject={handleReject}
        onEscalate={() => {
          console.log('Escalate to legal')
        }}
      />

    </div>
  )
}


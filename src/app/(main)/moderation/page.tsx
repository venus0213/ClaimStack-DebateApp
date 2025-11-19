'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchIcon, ClockIcon, FlagIcon, QuestionMarkIcon, LinkIcon } from '@/components/ui/Icons'
import { FilterButton } from '@/components/ui/FilterButton'
import { FilterValues } from '@/components/ui/FilterModal'
import { ReviewModal } from '@/components/moderation/ReviewModal'
import { Claim } from '@/lib/types'

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
  // Extended fields for detailed modal
  claimId?: string
  submittedDate?: string
  ipAddress?: string
  platform?: string
  userStrikeHistory?: string
  votesFor?: number
  votesAgainst?: number
  flagTimestamps?: Array<{ date: string; user: string }>
  // File information
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  // External link information
  url?: string
}

export default function ModerationPage() {
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

  // Fetch pending and rejected claims on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPending(true)
      setIsLoadingRejected(true)
      try {
        // Fetch pending claims
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

        // Fetch rejected claims
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

  // Combine all claims
  const allClaims = [...pendingClaims, ...rejectedClaims]

  // Transform claims to moderation items
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
        flaggedBy: 0, // TODO: Fetch flag count from API
        reason: claim.status === 'pending' ? 'Pending Review' : 'Rejected', // TODO: Fetch flag reasons from API
        link: undefined, // TODO: Add link if available
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
        ipAddress: undefined, // TODO: Add IP address if available
        platform: 'Web', // TODO: Add platform if available
        userStrikeHistory: undefined, // TODO: Fetch user strike history
        votesFor: 0, // TODO: Fetch votes if available
        votesAgainst: 0, // TODO: Fetch votes if available
        flagTimestamps: [], // TODO: Fetch flag timestamps
        fileUrl: claim.fileUrl || undefined,
        fileName: claim.fileName || undefined,
        fileSize: claim.fileSize || undefined,
        fileType: claim.fileType || undefined,
        url: claim.url || undefined,
      }
    })

  // Filter items based on search query
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
    // Apply filters to your data here
    console.log('Filters applied:', newFilters)
  }

  const handleReview = (item: ModerationItem) => {
    setSelectedItem(item)
    setIsReviewModalOpen(true)
  }

  const handleApprove = async () => {
    // This is called when approve is confirmed in ReviewModal's ApproveModal
    // The ReviewModal's child ApproveModal will handle the API call
    // We just need to refresh the list and close modals
    setIsReviewModalOpen(false)
    setSelectedItem(null)
    // Refresh the list
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
    // This is called when reject is confirmed in ReviewModal's RejectModal
    // The ReviewModal's child RejectModal will handle the API call
    // We just need to refresh the list and close modals
    setIsReviewModalOpen(false)
    setSelectedItem(null)
    // Refresh both lists
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
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-[46px] font-semibold text-[#030303]">Moderation Pannel</h1>
          <div className="flex-1 max-w-full sm:ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search claims, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            <p className="text-gray-600">Loading claims...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {!isLoadingPending && !isLoadingRejected && !error && filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No pending or rejected claims to review.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-4 sm:p-6 rounded-lg sm:rounded-[32px]">
              <div className="border-b border-gray-200 mb-3 sm:mb-4">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-200 text-black text-xs font-medium rounded-full">
                    Claim
                  </span>
                  {item.status === 'pending' && (
                    <span className="px-2 sm:px-3 py-1 sm:py-2 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Pending</span>
                    </span>
                  )}
                  {item.status === 'reviewed' && (
                    <span className="px-2 sm:px-3 py-1 sm:py-2 bg-red-200 text-red-800 text-xs font-medium rounded-full flex items-center space-x-1">
                      <FlagIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3 sm:mb-4">
                <div className="border-b border-gray-200 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-black">{item.user}</span>
                    <span className="text-xs sm:text-sm text-black">{item.date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-2 sm:mb-3">{item.title}</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600 border-b border-gray-200 mb-3 sm:mb-4 pb-3 sm:pb-4">
                  <span className="flex items-center space-x-1">
                    <FlagIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Flagged by: <strong className="text-[#030303]">{item.flaggedBy} users</strong></span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <QuestionMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Reasons: <strong className="text-[#030303]">{item.reason}</strong></span>
                  </span>
                </div>
                {item.link && (
                  <p className="text-xs sm:text-sm text-blue-600 mt-2 flex items-center space-x-1 border-b border-gray-200 mb-3 sm:mb-4 pb-3 sm:pb-4">
                    <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="break-all">{item.link}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => handleReview(item)}
                className="w-full px-4 py-2 sm:py-3 border border-gray-200 text-black text-xs sm:text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
              >
                Review Item
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Review Modal */}
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


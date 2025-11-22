'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ClaimSummary } from '@/components/claims/ClaimSummary'
import { ForAgainstToggle } from '@/components/claims/ForAgainstToggle'
import { ContentCard } from '@/components/content/ContentCard'
import { EvidenceUpload } from '@/components/evidence/EvidenceUpload'
import { PerspectiveUpload } from '@/components/perspective/PerspectiveUpload'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, FilterIcon, SortAscIcon } from '@/components/ui/Icons'
import { Evidence, Perspective, Claim } from '@/lib/types'
import { FilterButton } from '@/components/ui/FilterButton'
import { FilterValues } from '@/components/ui/FilterModal'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { VoteButtons } from '@/components/voting/VoteButtons'
import { useVote } from '@/hooks/useVote'
import { useFollow } from '@/hooks/useFollow'
import { useClaimsStore } from '@/store/claimsStore'
import { useEvidenceStore } from '@/store/evidenceStore'
import { useRef } from 'react'

export default function ClaimDetailPage() {
  const params = useParams()
  const claimId = params.id as string
  const { requireAuth } = useRequireAuth()
  const [position, setPosition] = useState<'for' | 'against'>('for')
  const [sortBy, setSortBy] = useState('recent')
  const [isSummariesExpanded, setIsSummariesExpanded] = useState(false)
  const [isSubmitEvidenceModalOpen, setIsSubmitEvidenceModalOpen] = useState(false)
  const [isSubmitPerspectiveModalOpen, setIsSubmitPerspectiveModalOpen] = useState(false)
  
  const { currentClaim, setCurrentClaim, updateClaim } = useClaimsStore()
  const { evidence, perspectives, setEvidence, setPerspectives, updateEvidence, updatePerspective } = useEvidenceStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterValues | null>(null)
  
  // Use claim from store or local state
  const claim = currentClaim

  // Use hooks for claim vote and follow
  const claimVote = useVote({
    itemId: claimId,
    itemType: 'claim',
    currentUpvotes: claim?.upvotes || 0,
    currentDownvotes: claim?.downvotes || 0,
    currentUserVote: claim?.userVote || null,
  })

  const claimFollow = useFollow({
    itemId: claimId,
    itemType: 'claim',
    currentIsFollowing: false, // Will be set from API
    currentFollowCount: claim?.followCount || 0,
  })

  // Fetch claim data
  useEffect(() => {
    const fetchClaim = async () => {
      if (!claimId) return
      try {
        const response = await fetch(`/api/claims/${claimId}`, {
          credentials: 'include',
        })
        if (!response.ok) throw new Error('Failed to fetch claim')
        const data = await response.json()
        if (data.success && data.claim) {
          setCurrentClaim(data.claim)
          // Update global store
          updateClaim(claimId, data.claim)
        }
      } catch (err) {
        console.error('Error fetching claim:', err)
      }
    }
    fetchClaim()
  }, [claimId, setCurrentClaim, updateClaim])

  // Fetch evidence and perspectives
  useEffect(() => {
    const fetchData = async () => {
      if (!claimId) return

      try {
        setLoading(true)
        setError(null)

        // Fetch evidence
        const evidenceParams = new URLSearchParams({ claimId })
        const evidenceResponse = await fetch(`/api/evidence?${evidenceParams.toString()}`, {
          credentials: 'include',
        })
        
        if (!evidenceResponse.ok) {
          const errorText = await evidenceResponse.text()
        }
        
        const evidenceData = await evidenceResponse.json()
        const fetchedEvidence = evidenceData.evidence || []

        // Fetch perspectives
        const perspectivesParams = new URLSearchParams({ claimId })
        const perspectivesResponse = await fetch(`/api/perspectives?${perspectivesParams.toString()}`, {
          credentials: 'include',
        })
        
        if (!perspectivesResponse.ok) {
          const errorText = await perspectivesResponse.text()
          throw new Error(`Failed to fetch perspectives: ${perspectivesResponse.status}`)
        }
        
        const perspectivesData = await perspectivesResponse.json()
        const fetchedPerspectives = perspectivesData.perspectives || []

        setEvidence(fetchedEvidence)
        setPerspectives(fetchedPerspectives)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [claimId])

  // Combine evidence and perspectives for current position
  const forEvidence = evidence.filter((e) => e.position === 'for')
  const againstEvidence = evidence.filter((e) => e.position === 'against')
  const forPerspectives = perspectives.filter((p) => p.position === 'for')
  const againstPerspectives = perspectives.filter((p) => p.position === 'against')

  // Combine and sort by creation date (most recent first)
  const combinedFor = [...forEvidence, ...forPerspectives].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const combinedAgainst = [...againstEvidence, ...againstPerspectives].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const currentItems = position === 'for' ? combinedFor : combinedAgainst

  const handleUpload = async (data: any) => {
    // Refetch data after upload
    const evidenceParams = new URLSearchParams({ claimId })
    const evidenceResponse = await fetch(`/api/evidence?${evidenceParams.toString()}`, {
      credentials: 'include',
    })
    if (evidenceResponse.ok) {
      const evidenceData = await evidenceResponse.json()
      setEvidence(evidenceData.evidence || [])
    }

    const perspectivesParams = new URLSearchParams({ claimId })
    const perspectivesResponse = await fetch(`/api/perspectives?${perspectivesParams.toString()}`, {
      credentials: 'include',
    })
    if (perspectivesResponse.ok) {
      const perspectivesData = await perspectivesResponse.json()
      setPerspectives(perspectivesData.perspectives || [])
    }

    // Always refetch claim to get updated score after upload
    // This ensures the score is recalculated and displayed correctly
    const claimResponse = await fetch(`/api/claims/${claimId}`, {
      credentials: 'include',
    })
    if (claimResponse.ok) {
      const claimData = await claimResponse.json()
      if (claimData.success && claimData.claim) {
        setCurrentClaim(claimData.claim)
        updateClaim(claimId, claimData.claim)
      }
    }
  }

  // Callbacks for ContentCard - hooks handle the actual logic
  const onVote = async (itemId: string, voteType: 'upvote' | 'downvote') => {
    // ContentCard handles voting through hooks, this is just for notification
    // Refetch claim to get updated score
    const claimResponse = await fetch(`/api/claims/${claimId}`, {
      credentials: 'include',
    })
    if (claimResponse.ok) {
      const claimData = await claimResponse.json()
      if (claimData.success && claimData.claim) {
        setCurrentClaim(claimData.claim)
        updateClaim(claimId, claimData.claim)
      }
    }
  }

  const onFollow = async (itemId: string) => {
    // ContentCard handles following through hooks, this is just for notification
  }

  const handleClaimVote = async (voteType: 'upvote' | 'downvote') => {
    await claimVote.vote(voteType)
  }

  const handleClaimFollow = async () => {
    await claimFollow.toggleFollow()
  }

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    // Apply filters to your data here
    console.log('Filters applied:', newFilters)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div
          className="inline-flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
        >
          <Link href="/browse">
            <ChevronLeftIcon className="w-7 h-7 mr-3 sm:mr-6" />
          </Link>
          <span className="hidden sm:inline">Claim Detail Page</span>
          <Link href="/browse">
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        {/* Statement Section */}
        <div className="bg-[#F9F9F9] rounded-2xl sm:rounded-[32px] border border-[#DCDCDC] p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center">
              <h2 className="text-sm sm:text-base font-normal text-[#666666]">Statement</h2>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-6 sm:mb-10 leading-tight">
            {claim?.title || 'Loading...'}
          </p>
          <div className="space-y-4 text-sm sm:text-base text-gray-600 pb-2">
            {claim?.description && (
              <p className="text-gray-700 leading-relaxed">{claim.description}</p>
            )}
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {claim?.category && (
                <div>
                  <span className="font-medium text-gray-500">Category: </span>
                  <span className="text-gray-900">{claim.category.name}</span>
                </div>
              )}
              {claim?.status && (
                <div>
                  <span className="font-medium text-gray-500">Status: </span>
                  <span className={`capitalize ${
                    claim.status === 'approved' ? 'text-green-600' :
                    claim.status === 'rejected' ? 'text-red-600' :
                    claim.status === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {claim.status}
                  </span>
                </div>
              )}
              {claim?.viewCount !== undefined && (
                <div>
                  <span className="font-medium text-gray-500">Views: </span>
                  <span className="text-gray-900">{claim.viewCount}</span>
                </div>
              )}
              {claim?.user && (
                <div>
                  <span className="font-medium text-gray-500">Author: </span>
                  <span className="text-gray-900">
                    {claim.user.firstName && claim.user.lastName
                      ? `${claim.user.firstName} ${claim.user.lastName}`
                      : claim.user.username}
                  </span>
                </div>
              )}
              {claim?.createdAt && (
                <div>
                  <span className="font-medium text-gray-500">Created: </span>
                  <span className="text-gray-900">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {claim?.url && (
              <div>
                <span className="font-medium text-gray-500">Source: </span>
                <a 
                  href={claim.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {claim.url}
                </a>
              </div>
            )}
            {claim?.fileUrl && (
              <div>
                <span className="font-medium text-gray-500">File: </span>
                <a 
                  href={claim.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {claim.fileName || 'View File'}
                </a>
                {claim.fileSize && (
                  <span className="text-gray-500 ml-2">
                    ({(claim.fileSize / 1024).toFixed(2)} KB)
                  </span>
                )}
              </div>
            )}
            
            {/* Voting, Following, and Score Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* Score Display */}
                {claim?.totalScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-500">Score: </span>
                    <span className={`text-lg font-semibold ${
                      claim.totalScore > 0 ? 'text-green-600' :
                      claim.totalScore < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {claim.totalScore > 0 ? '+' : ''}{claim.totalScore}
                    </span>
                  </div>
                )}
                
                {/* Vote Counts */}
                {(claim?.upvotes !== undefined || claim?.downvotes !== undefined) && (
                  <div className="flex items-center gap-4">
                    {claim.upvotes !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">Upvotes: </span>
                        <span className="text-gray-900 font-medium">{claim.upvotes || 0}</span>
                      </div>
                    )}
                    {claim.downvotes !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">Downvotes: </span>
                        <span className="text-gray-900 font-medium">{claim.downvotes || 0}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Follow Count */}
                {claim?.followCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-500">Followers: </span>
                    <span className="text-gray-900 font-medium">{claim.followCount || 0}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {/* <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClaimFollow}
                  disabled={claimFollow.isFollowingAction}
                  className="bg-black text-white hover:bg-gray-800 rounded-full text-xs sm:text-sm px-4 sm:px-5 py-2"
                >
                  {claimFollow.isFollowing ? 'Following' : 'Follow'}
                </Button>
                
                <VoteButtons
                  upvotes={claimVote.upvotes}
                  downvotes={claimVote.downvotes}
                  userVote={claimVote.userVote}
                  onVote={handleClaimVote}
                  disabled={claimVote.isVoting}
                />
              </div> */}
              <button 
                className="text-black hover:text-gray-600 p-1"
                onClick={() => setIsSummariesExpanded(!isSummariesExpanded)}
                aria-label="Toggle summaries"
              >
                {isSummariesExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 sm:w-7 sm:h-7" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 sm:w-7 sm:h-7" />
                )}
              </button>
            </div>
          </div>
          {/* Summaries */}
          {isSummariesExpanded && claim && (
            <ClaimSummary 
              evidence={evidence}
            />
          )}
        </div>


        {/* Supporting Evidence Section */}
        <div className="mb-6 sm:mb-8 mt-6 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-[32px] font-semibold text-gray-900">Supporting Evidence</h2>
            <div className='flex flex-row gap-2'>
              <Button
                variant="primary"
                className="rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto"
                onClick={() => requireAuth(() => setIsSubmitEvidenceModalOpen(true))}
              >
                Submit Evidence +
              </Button>
              <Button
                variant="primary"
                className="rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto"
                onClick={() => requireAuth(() => setIsSubmitPerspectiveModalOpen(true))}
              >
                Submit Perspective +
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <ForAgainstToggle
              position={position}
              onChange={setPosition}
              forCount={combinedFor.length}
              againstCount={combinedAgainst.length}
              className="w-full sm:w-auto"
            />
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button
                className={`px-3 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                  sortBy === 'recent'
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setSortBy('recent')}
              >
                Recent
              </button>
              <button className="px-3 sm:px-4 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                <SortAscIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Sort</span>
              </button>
              <FilterButton 
                onFiltersChange={handleFiltersChange}
                buttonClassName="text-xs sm:text-sm px-3 sm:px-4"
                iconSize="w-3 h-3 sm:w-4 sm:h-5"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading evidence and perspectives...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">Error: {error}</div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No {position === 'for' ? 'supporting' : 'opposing'} evidence or perspectives yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  (Total evidence: {evidence.length}, Total perspectives: {perspectives.length})
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {currentItems.map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  onVote={onVote} 
                  onFollow={onFollow}
                  claimId={claimId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Evidence Modal */}
      <Modal
        isOpen={isSubmitEvidenceModalOpen}
        onClose={() => setIsSubmitEvidenceModalOpen(false)}
        title="Submit Evidence"
      >
        <EvidenceUpload 
          claimId={params.id as string}
          onUpload={handleUpload} 
          onClose={() => setIsSubmitEvidenceModalOpen(false)} 
        />
      </Modal>

      {/* Submit Perspective Modal */}
      <Modal
        isOpen={isSubmitPerspectiveModalOpen}
        onClose={() => setIsSubmitPerspectiveModalOpen(false)}
        title="Submit Perspective"
      >
        <PerspectiveUpload 
          claimId={params.id as string}
          onUpload={handleUpload} 
          onClose={() => setIsSubmitPerspectiveModalOpen(false)} 
        />
      </Modal>
    </div>
  )
}


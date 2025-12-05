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
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, FilterIcon, SortAscIcon, XIcon } from '@/components/ui/Icons'
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
import { MediaDisplay } from '@/components/moderation/MediaDisplay'
import { useAuth } from '@/hooks/useAuth'

export default function ClaimDetailPage() {
  const params = useParams()
  const claimId = params.id as string
  const { requireAuth } = useRequireAuth()
  const [position, setPosition] = useState<'for' | 'against'>('for')
  const [sortBy, setSortBy] = useState('recent')
  const [isSummariesExpanded, setIsSummariesExpanded] = useState(false)
  const [isSubmitEvidenceModalOpen, setIsSubmitEvidenceModalOpen] = useState(false)
  const [isSubmitPerspectiveModalOpen, setIsSubmitPerspectiveModalOpen] = useState(false)
  const [isMediaHidden, setIsMediaHidden] = useState(false)
  
  const { currentClaim, setCurrentClaim, updateClaim } = useClaimsStore()
  const { evidence, perspectives, setEvidence, setPerspectives, updateEvidence, updatePerspective } = useEvidenceStore()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claimLoading, setClaimLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterValues | null>(null)
  const [titleEditor, setTitleEditor] = useState<{ username: string } | null>(null)
  const [descriptionEditor, setDescriptionEditor] = useState<{ username: string } | null>(null)
  
  // Use claim from store or local state - only use it if it matches the current claimId
  const claim = currentClaim && currentClaim.id === claimId ? currentClaim : null

  // Check if user can see edit information (admin or creator)
  const isAdmin = currentUser && (currentUser.role?.toUpperCase() === 'ADMIN' || currentUser.role?.toUpperCase() === 'MODERATOR')
  const isCreator = currentUser && claim && claim.userId === currentUser.id
  const canSeeEditInfo = isAdmin || isCreator

  // Fetch editor user information
  useEffect(() => {
    const fetchEditors = async () => {
      if (!claim || !canSeeEditInfo) {
        setTitleEditor(null)
        setDescriptionEditor(null)
        return
      }

      // Fetch title editor
      if (claim.titleEdited && claim.titleEditedBy) {
        try {
          const response = await fetch(`/api/users/${claim.titleEditedBy}`, {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              setTitleEditor({ username: data.user.username })
            }
          }
        } catch (err) {
          console.error('Error fetching title editor:', err)
        }
      }

      // Fetch description editor
      if (claim.descriptionEdited && claim.descriptionEditedBy) {
        try {
          const response = await fetch(`/api/users/${claim.descriptionEditedBy}`, {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              setDescriptionEditor({ username: data.user.username })
            }
          }
        } catch (err) {
          console.error('Error fetching description editor:', err)
        }
      }
    }

    fetchEditors()
  }, [claim, canSeeEditInfo])

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
      
      // Clear previous claim and set loading state
      setCurrentClaim(null)
      setClaimLoading(true)
      
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
        } else {
          throw new Error('Claim not found')
        }
      } catch (err) {
        console.error('Error fetching claim:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch claim')
      } finally {
        setClaimLoading(false)
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div
          className="inline-flex items-center text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3 sm:mb-4 lg:mb-6 transition-colors"
        >
          <Link href="/browse">
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 mr-2 sm:mr-3 lg:mr-6" />
          </Link>
          <span className="hidden sm:inline">Claim Detail Page</span>
          <Link href="/browse">
            <span className="sm:hidden text-sm">Back</span>
          </Link>
        </div>

        {/* Statement Section */}
        <div className="bg-[#F9F9F9] dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-[32px] border border-[#DCDCDC] dark:border-gray-700 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 transition-colors">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <div className="flex items-center">
              <h2 className="text-xs sm:text-sm lg:text-base font-normal text-[#666666] dark:text-gray-400">Statement</h2>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-gray-100 sm:mb-6 mb-4 leading-tight">
            {claimLoading ? 'Loading...' : (claim?.title || 'Claim not found')}
          </p>
          
          {/* Description Section */}
          {claimLoading ? (
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-4 sm:mb-6 lg:mb-8">Loading...</p>
          ) : claim?.description ? (
            <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4 sm:mb-6 lg:mb-8">
              {claim.description}
            </p>
          ) : null}
          
          {/* Two Column Layout: Media on Left, Metadata on Right */}
          <div className={`grid grid-cols-1 ${!isMediaHidden ? 'lg:grid-cols-2' : ''} gap-4 sm:gap-6 lg:gap-8 xl:gap-12 py-4 sm:py-6 items-stretch`}>
            {/* Left Section: Media Display */}
            {!isMediaHidden && (
              <div className="flex flex-col space-y-1 h-full">
                <div className="flex items-center justify-between mb-2 sm:mb-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#030303] dark:text-gray-100">Media</h2>
                  <button
                    onClick={() => setIsMediaHidden(true)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    aria-label="Hide media"
                  >
                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col">
                  {claimLoading ? (
                    <div className="w-full flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center min-h-[200px] sm:min-h-[300px] lg:min-h-[400px]">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Loading...</p>
                    </div>
                  ) : (claim?.fileUrl || claim?.url) ? (
                    <div className="flex-1">
                      <MediaDisplay
                        fileUrl={claim.fileUrl}
                        fileName={claim.fileName}
                        fileSize={claim.fileSize}
                        fileType={claim.fileType}
                        url={claim.url}
                        title={claim.title}
                      />
                    </div>
                  ) : (
                    <div className="w-full flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center min-h-[200px] sm:min-h-[300px] lg:min-h-[400px]">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">No media available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Section: Detailed Metadata */}
            <div className={`space-y-4 sm:space-y-5 ${!isMediaHidden ? 'lg:border-l lg:border-gray-200 lg:dark:border-gray-700 lg:pl-6 xl:pl-8' : ''} h-full`}>
              {!claimLoading && claim?.forSummary && (
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#030303] dark:text-gray-100 sm:mb-4 lg:mb-5 mb-3">AI Summary of Claim</h2>
                  <p className="text-xs sm:text-sm text-[#030303] dark:text-gray-200 leading-relaxed">{claim.forSummary}</p>
                </div>
              )}              
              <h2 className="text-lg sm:text-xl font-semibold text-[#030303] dark:text-gray-100 sm:mb-5 mb-3 sm:pt-10 pt-6">Details</h2>
              
              {claimLoading ? (
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Loading details...</p>
                </div>
              ) : (
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {claim?.category && (
                    <div className="break-words">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="ml-1 sm:ml-2 font-medium text-[#030303] dark:text-gray-100 break-words">{claim.category.name}</span>
                    </div>
                  )}
                  
                  {claim?.status && (
                    <div className="break-words">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`ml-1 sm:ml-2 font-medium capitalize ${
                        claim.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                        claim.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                        claim.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                  )}
                  
                  {claim?.viewCount !== undefined && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Views:</span>
                      <span className="ml-1 sm:ml-2 font-medium text-[#030303] dark:text-gray-100">{claim.viewCount}</span>
                    </div>
                  )}
                  
                  {claim?.user && (
                    <div className="break-words">
                      <span className="text-gray-600 dark:text-gray-400">Author:</span>
                      <span className="ml-1 sm:ml-2 font-medium text-[#030303] dark:text-gray-100 break-words">
                        {claim.user.firstName && claim.user.lastName
                          ? `${claim.user.firstName} ${claim.user.lastName}`
                          : claim.user.username}
                      </span>
                    </div>
                  )}
                  
                  {claim?.createdAt && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="ml-1 sm:ml-2 font-medium text-[#030303] dark:text-gray-100">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {claim?.totalScore !== undefined && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Score:</span>
                      <span className={`ml-1 sm:ml-2 text-base sm:text-lg font-semibold ${
                        claim.totalScore > 0 ? 'text-green-600 dark:text-green-400' :
                        claim.totalScore < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {claim.totalScore > 0 ? '+' : ''}{claim.totalScore}
                      </span>
                    </div>
                  )}
                  
                  {claim?.followCount !== undefined && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Followers:</span>
                      <span className="ml-1 sm:ml-2 font-medium text-[#030303] dark:text-gray-100">{claim.followCount || 0}</span>
                    </div>
                  )}
                </div>

                {(claim?.upvotes !== undefined || claim?.downvotes !== undefined) && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Votes:</span>
                    <span className="flex items-center gap-1 sm:gap-2">
                      <span className="font-medium text-blue-600 dark:text-blue-400 text-xs sm:text-sm">{claim.upvotes || 0} Upvotes</span>
                      <span className="text-gray-400 dark:text-gray-500">/</span>
                      <span className="font-medium text-red-600 dark:text-red-400 text-xs sm:text-sm">{claim.downvotes || 0} Downvotes</span>
                    </span>
                  </div>
                )}
                
                {/* Edit Information */}
                {canSeeEditInfo && (claim?.titleEdited || claim?.descriptionEdited) && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                    {/* <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Edit Information
                    </h3> */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Title Edit Info */}
                      {claim.titleEdited && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            This claim title was edited{' '}
                            {claim.titleEditedAt && (
                              <>
                                at{' '}
                                <span className="font-medium">
                                  {new Date(claim.titleEditedAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </>
                            )}
                            {titleEditor && (
                              <>
                                {' '}by{' '}
                                <span className="font-medium">@{titleEditor.username}</span>
                              </>
                            )}
                            {claim.titleEditReason && (
                              <>
                                {' '}for the following reason: <span className="font-medium">&quot;{claim.titleEditReason}&quot;.</span>
                              </>
                            )}
                            {claim.originalTitle && (
                              <>
                              <br />
                                Original title was: <span className="font-medium italic text-blue-700">&quot;{claim.originalTitle}&quot;</span>
                              </>
                            )}
                            .
                          </p>
                        </div>
                      )}

                      {/* Description Edit Info */}
                      {claim.descriptionEdited && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            This claim description was edited{' '}
                            {claim.descriptionEditedAt && (
                              <>
                                at{' '}
                                <span className="font-medium">
                                  {new Date(claim.descriptionEditedAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </>
                            )}
                            {descriptionEditor && (
                              <>
                                {' '}by{' '}
                                <span className="font-medium">@{descriptionEditor.username}</span>
                              </>
                            )}
                            {claim.descriptionEditReason && (
                              <>
                                {' '}for the following reason: <span className="font-medium text-purple-700 dark:text-purple-300">&quot;{claim.descriptionEditReason}&quot;</span>
                              </>
                            )}
                            {claim.originalDescription && (
                              <>
                                . Original description was: <span className="font-medium italic">&quot;{claim.originalDescription}&quot;</span>
                              </>
                            )}
                            .
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
          {/* Toggle Summaries Button */}
          <div className="flex items-center justify-end pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              className="text-black dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 p-1 flex items-center gap-1.5 sm:gap-2 transition-colors"
              onClick={() => setIsSummariesExpanded(!isSummariesExpanded)}
              aria-label="Toggle summaries"
            >
              <span className="text-xs sm:text-sm font-medium">
                {isSummariesExpanded ? 'Hide' : 'Show'} Summaries
              </span>
              {isSummariesExpanded ? (
                <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>    
          
          {/* Summaries */}
          {isSummariesExpanded && claim && (
            <div className="sm:mt-3">
              <ClaimSummary 
                evidence={evidence}
              />
            </div>
          )}
        </div>


        {/* Supporting Evidence Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8 mt-4 sm:mt-6 lg:mt-10 flex flex-col gap-4 sm:gap-6 lg:gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-[32px] font-semibold text-gray-900 dark:text-gray-100">Supporting Evidence</h2>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <ForAgainstToggle
              position={position}
              onChange={setPosition}
              forCount={combinedFor.length}
              againstCount={combinedAgainst.length}
              className="w-full sm:w-auto"
            />
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-wrap">
              <button
                className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 ${
                  sortBy === 'recent'
                    ? 'bg-white dark:bg-gray-800 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSortBy('recent')}
              >
                Recent
              </button>
              <button className="px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 sm:gap-2 transition-colors">
                <SortAscIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Sort</span>
              </button>
              <FilterButton 
                onFiltersChange={handleFiltersChange}
                buttonClassName="text-xs sm:text-sm px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2"
                iconSize="w-3 h-3 sm:w-4 sm:h-5"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading evidence and perspectives...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-sm sm:text-base text-red-600 dark:text-red-400">Error: {error}</div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center px-4">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">No {position === 'for' ? 'supporting' : 'opposing'} evidence or perspectives yet</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
                  (Total evidence: {evidence.length}, Total perspectives: {perspectives.length})
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
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


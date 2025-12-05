'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, EditIcon } from '@/components/ui/Icons'
import { Claim, Evidence, Perspective, User } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'
import { EditClaimModal } from '@/components/claims/EditClaimModal'

interface ClaimWithContent extends Claim {
  evidence?: Evidence[]
  perspectives?: Perspective[]
  _loadingContent?: boolean
  _contentLoaded?: boolean
}

export default function ContentManagementPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [claims, setClaims] = useState<ClaimWithContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    type: 'claim' | 'evidence' | 'perspective'
    title?: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [claimToEdit, setClaimToEdit] = useState<ClaimWithContent | null>(null)

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

  // Reusable function to fetch claims (without evidence/perspectives)
  const fetchClaims = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const statuses = ['approved', 'pending', 'rejected']
      const allClaimsPromises = statuses.map((status) =>
        fetch(`/api/claims?status=${status}&sortBy=newest&limit=1000`, {
          credentials: 'include',
        }).then((res) => res.json())
      )

      const allClaimsResults = await Promise.all(allClaimsPromises)
      const allClaims: Claim[] = []
      
      allClaimsResults.forEach((result) => {
        if (result.success && result.claims) {
          allClaims.push(...result.claims)
        }
      })

      // Remove duplicates (in case any claim appears in multiple statuses)
      const uniqueClaims = Array.from(
        new Map(allClaims.map((claim) => [claim.id, claim])).values()
      )

      // Initialize claims without evidence/perspectives (lazy load them)
      const claimsWithContent: ClaimWithContent[] = uniqueClaims.map((claim: Claim) => ({
        ...claim,
        evidence: undefined,
        perspectives: undefined,
        _loadingContent: false,
        _contentLoaded: false,
      }))

      setClaims(claimsWithContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch evidence and perspectives for a specific claim (lazy loading)
  const fetchClaimContent = async (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId)
    if (!claim || claim._contentLoaded || claim._loadingContent) return

    // Mark as loading
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, _loadingContent: true } : c
      )
    )

    try {
      // Fetch evidence and perspectives in parallel
      const [evidenceResponse, perspectivesResponse] = await Promise.all([
        fetch(`/api/evidence?claimId=${claimId}`, {
          credentials: 'include',
        }),
        fetch(`/api/perspectives?claimId=${claimId}`, {
          credentials: 'include',
        }),
      ])

      let evidence: Evidence[] = []
      if (evidenceResponse.ok) {
        const evidenceData = await evidenceResponse.json()
        if (evidenceData.success && evidenceData.evidence) {
          evidence = evidenceData.evidence
        }
      }

      let perspectives: Perspective[] = []
      if (perspectivesResponse.ok) {
        const perspectivesData = await perspectivesResponse.json()
        if (perspectivesData.success && perspectivesData.perspectives) {
          perspectives = perspectivesData.perspectives
        }
      }

      // Update the claim with loaded content
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                evidence,
                perspectives,
                _loadingContent: false,
                _contentLoaded: true,
              }
            : c
        )
      )
    } catch (err) {
      console.error('Error fetching claim content:', err)
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId ? { ...c, _loadingContent: false } : c
        )
      )
    }
  }

  useEffect(() => {
    if (!user || user.role?.toUpperCase() !== 'ADMIN') return
    fetchClaims()
  }, [user, router])

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

  const toggleExpand = (claimId: string) => {
    setExpandedClaims((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(claimId)) {
        newSet.delete(claimId)
      } else {
        newSet.add(claimId)
        // Fetch content when expanding (lazy load)
        fetchClaimContent(claimId)
      }
      return newSet
    })
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
      // case 'flagged':
      //   return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPositionBadgeColor = (position: 'for' | 'against') => {
    return position === 'for'
      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  }

  // Filter claims based on search and status
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      !searchQuery ||
      claim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.user?.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const truncateDescription = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getDescriptionLines = (text: string | undefined, maxLines: number = 2) => {
    if (!text) return ''
    const lines = text.split('\n').filter((line) => line.trim())
    return lines.slice(0, maxLines).join('\n')
  }

  // Delete function
  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      let endpoint = ''
      if (itemToDelete.type === 'claim') {
        endpoint = `/api/claims/${itemToDelete.id}`
      } else if (itemToDelete.type === 'evidence') {
        endpoint = `/api/evidence/${itemToDelete.id}`
      } else if (itemToDelete.type === 'perspective') {
        endpoint = `/api/perspectives/${itemToDelete.id}`
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      // Refresh the data (only claims, not content)
      await fetchClaims()
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-4 lg:mb-8 gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-[46px] font-semibold text-[#030303] dark:text-gray-100">
            Content Management
          </h1>
          <div className="flex-1 max-w-full sm:ml-4 lg:ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search claims, authors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs sm:text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
          {['all', 'approved', 'pending', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading content...</p>
          </div>
        )}

        {/* Claims Table */}
        {!isLoading && (
          <>
            <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredClaims.length} of {claims.length} claims
            </div>
            <Card className="p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-[32px] overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 w-10 sm:w-12"></th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Claim Title
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Author</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Votes</th>
                    {/* <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Views</th> */}
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Created</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        No claims found
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => {
                      const isExpanded = expandedClaims.has(claim.id)
                      const evidenceCount = claim.evidence?.length || 0
                      const perspectivesCount = claim.perspectives?.length || 0

                      return (
                        <React.Fragment key={claim.id}>
                          {/* Main Claim Row */}
                          <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <button
                                onClick={() => toggleExpand(claim.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                disabled={claim._loadingContent}
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                  <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="group relative">
                                <Link
                                  href={`/claims/${claim.id}`}
                                  className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words"
                                >
                                  {claim.title}{claim.titleEdited ? ' (edited)' : ''}
                                </Link>
                                {claim.description && (
                                  <div className="hidden sm:block absolute left-0 top-full mt-2 w-80 lg:w-96 p-3 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs sm:text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-700">
                                    <div className="whitespace-pre-line line-clamp-2">
                                      {getDescriptionLines(claim.description, 2)}
                                    </div>
                                    {claim.description.split('\n').length > 2 && (
                                      <div className="mt-1 text-xs text-gray-400">...</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 sm:line-clamp-none">
                                {truncateDescription(claim.description, 40)}{claim.descriptionEdited ? ' (edited)' : ''}
                              </div>
                              {/* Mobile: Show status and votes inline */}
                              <div className="flex items-center gap-2 mt-1 sm:hidden">
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                    claim.status
                                  )}`}
                                >
                                  {claim.status}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{claim.upvotes || 0} / -{claim.downvotes || 0}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {claim.user ? (
                                <>
                                  {/* Mobile: Only username */}
                                  <div className="sm:hidden">
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                      @{claim.user.username}
                                    </span>
                                  </div>
                                  {/* Desktop: Full author info */}
                                  <div className="hidden sm:flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-blue-500 dark:border-blue-400 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                                      {claim.user.avatarUrl ? (
                                        <img
                                          src={claim.user.avatarUrl}
                                          alt={claim.user.username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                          {claim.user.username.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                        @{claim.user.username}
                                      </div>
                                      {(claim.user.firstName || claim.user.lastName) && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {claim.user.firstName} {claim.user.lastName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Unknown</span>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                  claim.status
                                )}`}
                              >
                                {claim.status}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400">+{claim.upvotes || 0}</span>
                                <span className="text-red-600 dark:text-red-400">-{claim.downvotes || 0}</span>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                              {formatDate(claim.createdAt)}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={() => {
                                    setClaimToEdit(claim)
                                    setEditModalOpen(true)
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1"
                                  title="Edit"
                                >
                                  <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setItemToDelete({ id: claim.id, type: 'claim', title: claim.title })
                                    setDeleteModalOpen(true)
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Content: Evidence and Perspectives */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="py-3 sm:py-4 px-2 sm:px-4 bg-gray-50 dark:bg-gray-900/50">
                                {claim._loadingContent ? (
                                  <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Loading content...
                                  </div>
                                ) : (
                                  <div className="space-y-4 sm:space-y-6">
                                    {/* Evidence Section */}
                                    {evidenceCount > 0 && claim.evidence && (
                                    <div>
                                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                                        Evidence ({evidenceCount})
                                      </h3>
                                      <div className="space-y-2 sm:space-y-3">
                                        {claim.evidence?.map((evidence) => (
                                          <div
                                            key={evidence.id}
                                            className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                          >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                                                  <span
                                                    className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getPositionBadgeColor(
                                                      evidence.position
                                                    )}`}
                                                  >
                                                    {evidence.position.toUpperCase()}
                                                  </span>
                                                  <span className="px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {evidence.type}
                                                  </span>
                                                  <span
                                                    className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                                      evidence.status
                                                    )}`}
                                                  >
                                                    {evidence.status}
                                                  </span>
                                                </div>
                                                {evidence.title && (
                                                  <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 break-words">
                                                    {evidence.title}
                                                  </div>
                                                )}
                                                {evidence.description && (
                                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                                                    {truncateDescription(evidence.description, 100)}
                                                  </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                  <span>
                                                    Author: @{evidence.user?.username || 'Unknown'}
                                                  </span>
                                                  <span>Votes: +{evidence.upvotes || 0} / -{evidence.downvotes || 0}</span>
                                                  <span className="hidden sm:inline">Created: {formatDateTime(evidence.createdAt)}</span>
                                                  <span className="sm:hidden">Created: {formatDate(evidence.createdAt)}</span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 sm:gap-2">
                                                <Link
                                                  href={`/claims/${claim.id}`}
                                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-medium whitespace-nowrap"
                                                >
                                                  View
                                                </Link>
                                                <button
                                                  onClick={() => {
                                                    setItemToDelete({
                                                      id: evidence.id,
                                                      type: 'evidence',
                                                      title: evidence.title || 'Evidence',
                                                    })
                                                    setDeleteModalOpen(true)
                                                  }}
                                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm font-medium flex items-center gap-1"
                                                >
                                                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                  <span className="hidden sm:inline">Delete</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                    {/* Perspectives Section */}
                                    {perspectivesCount > 0 && claim.perspectives && (
                                      <div>
                                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                                          Perspectives ({perspectivesCount})
                                        </h3>
                                        <div className="space-y-2 sm:space-y-3">
                                          {claim.perspectives.map((perspective) => (
                                          <div
                                            key={perspective.id}
                                            className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                          >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                                                  <span
                                                    className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getPositionBadgeColor(
                                                      perspective.position
                                                    )}`}
                                                  >
                                                    {perspective.position.toUpperCase()}
                                                  </span>
                                                  <span
                                                    className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                                      perspective.status
                                                    )}`}
                                                  >
                                                    {perspective.status}
                                                  </span>
                                                </div>
                                                {perspective.title && (
                                                  <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 break-words">
                                                    {perspective.title}
                                                  </div>
                                                )}
                                                {perspective.body && (
                                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                                                    {truncateDescription(perspective.body, 100)}
                                                  </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                  <span>
                                                    Author: @{perspective.user?.username || 'Unknown'}
                                                  </span>
                                                  <span>
                                                    Votes: +{perspective.upvotes || 0} / -{perspective.downvotes || 0}
                                                  </span>
                                                  <span className="hidden sm:inline">Created: {formatDateTime(perspective.createdAt)}</span>
                                                  <span className="sm:hidden">Created: {formatDate(perspective.createdAt)}</span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Link
                                                  href={`/claims/${claim.id}`}
                                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-medium whitespace-nowrap"
                                                >
                                                  View
                                                </Link>
                                                <button
                                                  onClick={() => {
                                                    setItemToDelete({
                                                      id: perspective.id,
                                                      type: 'perspective',
                                                      title: perspective.title || 'Perspective',
                                                    })
                                                    setDeleteModalOpen(true)
                                                  }}
                                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm font-medium flex items-center gap-1"
                                                >
                                                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                  <span className="hidden sm:inline">Delete</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                    {evidenceCount === 0 && perspectivesCount === 0 && !claim._loadingContent && (
                                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
                                        No evidence or perspectives for this claim
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>

      {/* Edit Claim Modal */}
      {claimToEdit && (
        <EditClaimModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setClaimToEdit(null)
          }}
          onConfirm={async () => {
            // Refresh the data after editing (only claims, not content)
            await fetchClaims()
            setEditModalOpen(false)
            setClaimToEdit(null)
          }}
          claimId={claimToEdit.id}
          claim={claimToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setItemToDelete(null)
        }}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this {itemToDelete?.type}?
            {itemToDelete?.title && (
              <span className="font-semibold block mt-2 break-words">{itemToDelete.title}</span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
            This action cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setItemToDelete(null)
              }}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              isLoading={isDeleting}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


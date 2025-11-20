'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Claim, Evidence, Perspective } from '@/lib/types'
import type { Evidence as EvidenceType, Perspective as PerspectiveType } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VoteButtons } from '@/components/voting/VoteButtons'
import { ShareIcon, UserIcon } from '@/components/ui/Icons'
import { ProtectedLink } from '@/components/ui/ProtectedLink'
import { useVote } from '@/hooks/useVote'
import { useFollow } from '@/hooks/useFollow'

interface ContentCardProps {
  item: Claim | Evidence | Perspective
  onFollow?: (itemId: string) => void
  onVote?: (itemId: string, voteType: 'upvote' | 'downvote') => void
  userVote?: 'upvote' | 'downvote' | null
  isFollowing?: boolean
  href?: string
  claimId?: string // For evidence/perspective to update claim score
}

// Type guard to check if item is Evidence
function isEvidence(item: Claim | Evidence | Perspective): item is Evidence {
  return 'upvotes' in item && 'downvotes' in item && 'position' in item && 'type' in item
}

// Type guard to check if item is Perspective
function isPerspective(item: Claim | Evidence | Perspective): item is Perspective {
  return 'upvotes' in item && 'downvotes' in item && 'position' in item && 'body' in item && !('type' in item)
}

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  onFollow,
  onVote,
  userVote: propUserVote,
  isFollowing: propIsFollowing,
  href,
  claimId,
}) => {
  const isEvidenceItem = isEvidence(item)
  const isPerspectiveItem = isPerspective(item)
  const isClaimItem = !isEvidenceItem && !isPerspectiveItem
  const title = item.title || ''
  const description = isPerspectiveItem ? item.body : (isEvidenceItem ? item.description : item.description)
  const user = item.user
  const itemId = item.id

  // Determine item type for hooks
  const itemType = isClaimItem ? 'claim' : isEvidenceItem ? 'evidence' : 'perspective'
  
  // Get claimId from item if not provided
  const effectiveClaimId = claimId || (isEvidenceItem ? (item as Evidence).claimId : isPerspectiveItem ? (item as Perspective).claimId : undefined)

  // Get initial values from item
  const initialUpvotes = isClaimItem 
    ? (item as Claim).upvotes || 0
    : (isEvidenceItem || isPerspectiveItem) 
    ? item.upvotes || 0
    : 0
  const initialDownvotes = isClaimItem 
    ? (item as Claim).downvotes || 0
    : (isEvidenceItem || isPerspectiveItem) 
    ? item.downvotes || 0
    : 0
  const initialUserVote = propUserVote !== undefined 
    ? propUserVote 
    : (isClaimItem
      ? (item as Claim).userVote || null
      : (isEvidenceItem || isPerspectiveItem) 
      ? (item as Evidence | Perspective).userVote || null
      : null)
  const initialIsFollowing = propIsFollowing !== undefined
    ? propIsFollowing
    : (isClaimItem
      ? false // Claims don't have isFollowing in the type
      : (item as Evidence | Perspective).isFollowing || false)
  const initialFollowCount = isClaimItem
    ? (item as Claim).followCount || 0
    : (item as Evidence | Perspective).followCount || 0

  // Use global state hooks
  const { upvotes, downvotes, userVote, isVoting, vote } = useVote({
    itemId,
    itemType,
    currentUpvotes: initialUpvotes,
    currentDownvotes: initialDownvotes,
    currentUserVote: initialUserVote,
    claimId: effectiveClaimId,
  })

  const { isFollowing, followCount, isFollowingAction, toggleFollow } = useFollow({
    itemId,
    itemType,
    currentIsFollowing: initialIsFollowing,
    currentFollowCount: initialFollowCount,
  })

  // Sync with props if they change (for external control)
  useEffect(() => {
    if (propUserVote !== undefined && propUserVote !== userVote) {
      // The hook will handle this through its internal state
    }
  }, [propUserVote, userVote])

  // Determine card type for display
  const cardType = isEvidenceItem ? 'Evidence' : isPerspectiveItem ? 'Perspective' : ''
  const cardTypeColor = isEvidenceItem 
    ? 'bg-blue-100 text-blue-700' 
    : isPerspectiveItem 
    ? 'bg-purple-100 text-purple-700' 
    : ''

  // For claims, use the provided href or default to /claims/{id}
  // For evidence, don't make title clickable unless href is provided
  const titleHref = href || (isEvidenceItem ? undefined : `/claims/${itemId}`)

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      await vote(voteType)
      // Call optional callback
      onVote?.(itemId, voteType)
    } catch (error) {
      // Error is already handled in the hook
      throw error
    }
  }

  const handleFollow = async () => {
    try {
      await toggleFollow()
      // Call optional callback
      onFollow?.(itemId)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  return (
    <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-[32px]">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-[#030303] font-medium">@{user?.username || 'user'}</span>
        </div>
        <div className='flex items-center space-x-2'>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cardTypeColor}`}>
            {cardType}
          </span>
          {/* <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">  
            <ShareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          </button> */}
        </div>
      </div>

      {title && (
        titleHref ? (
          <ProtectedLink href={titleHref}>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-600 hover:text-blue-700 mb-2 leading-tight cursor-pointer">
              {title}
            </h3>
          </ProtectedLink>
        ) : (
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-600 hover:text-blue-700 mb-2 leading-tight">
            {title}
          </h3>
        )
      )}

      {description && (
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 font-normal leading-relaxed">{description}</p>
      )}

      {user && (
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="flex flex-row items-center gap-1 sm:gap-2 flex-wrap">
            <div className="text-xs sm:text-sm text-[#030303] font-medium">Author:</div> 
            <span>{user.firstName} {user.lastName}</span>
          </span>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFollow}
            disabled={isFollowingAction}
            className="bg-black text-white hover:bg-gray-800 rounded-full text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>

          <VoteButtons
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            onVote={handleVote}
            disabled={isVoting}
          />
        </div>
      </div>
    </Card>
  )
}


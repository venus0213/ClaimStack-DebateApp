'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Claim, Evidence, Perspective } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VoteButtons } from '@/components/voting/VoteButtons'
import { UserIcon, TrashIcon, ClockIcon, FlagIcon, CheckIcon, EditIcon } from '@/components/ui/Icons'
import { ProtectedLink } from '@/components/ui/ProtectedLink'
import { Modal } from '@/components/ui/Modal'
import { useVote } from '@/hooks/useVote'
import { useFollow } from '@/hooks/useFollow'
import { useAuth } from '@/hooks/useAuth'
import { ReplyModal } from '@/components/replies/ReplyModal'
import { cn } from '@/lib/utils/cn'

interface ContentCardProps {
  item: Claim | Evidence | Perspective
  onFollow?: (itemId: string) => void
  onVote?: (itemId: string, voteType: 'upvote' | 'downvote') => void
  userVote?: 'upvote' | 'downvote' | null
  isFollowing?: boolean
  href?: string
  claimId?: string
  showDelete?: boolean
  onDelete?: (itemId: string, itemType: 'claim' | 'evidence' | 'perspective') => void
  showEdit?: boolean
  onEdit?: (itemId: string) => void
}

function isEvidence(item: Claim | Evidence | Perspective): item is Evidence {
  return 'upvotes' in item && 'downvotes' in item && 'position' in item && 'type' in item
}

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
  showDelete = false,
  onDelete,
  showEdit = false,
  onEdit,
}) => {
  const isEvidenceItem = isEvidence(item)
  const isPerspectiveItem = isPerspective(item)
  const isClaimItem = !isEvidenceItem && !isPerspectiveItem
  const claimItem = isClaimItem ? (item as Claim) : null
  const title = item.title || ''
  const displayTitle = isClaimItem && claimItem?.titleEdited 
    ? `${title} (edited)`
    : title
  const description = isPerspectiveItem ? item.body : (isEvidenceItem ? item.description : item.description)
  const displayDescription = isClaimItem && claimItem?.descriptionEdited && description
    ? `${description} (edited)`
    : description
  const user = item.user
  const itemId = item.id
  const { user: currentUser } = useAuth()
  const pathname = usePathname()
  const isBrowsePage = pathname === '/browse'
  const isMainPage = pathname === '/'
  const shouldHideApprovedStatus = isBrowsePage || isMainPage

  const itemType = isClaimItem ? 'claim' : isEvidenceItem ? 'evidence' : 'perspective'
  
  const effectiveClaimId = claimId || (isEvidenceItem ? (item as Evidence).claimId : isPerspectiveItem ? (item as Perspective).claimId : undefined)

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
      ? false
      : (item as Evidence | Perspective).isFollowing || false)
  const initialFollowCount = isClaimItem
    ? (item as Claim).followCount || 0
    : (item as Evidence | Perspective).followCount || 0

  const { upvotes, downvotes, userVote, isVoting, vote } = useVote({
    itemId,
    itemType,
    currentUpvotes: initialUpvotes,
    currentDownvotes: initialDownvotes,
    currentUserVote: initialUserVote,
    claimId: effectiveClaimId,
  })

  const { isFollowing, isFollowingAction, toggleFollow } = useFollow({
    itemId,
    itemType,
    currentIsFollowing: initialIsFollowing,
    currentFollowCount: initialFollowCount,
  })

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showReadMore, setShowReadMore] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyCount, setReplyCount] = useState<number | null>(null)

  useEffect(() => {
    if (descriptionRef.current && !isDescriptionExpanded) {
      const element = descriptionRef.current
      const isTruncated = element.scrollHeight > element.clientHeight
      setShowReadMore(isTruncated)
    } else {
      setShowReadMore(false)
    }
  }, [description, isDescriptionExpanded])

  useEffect(() => {
    if (propUserVote !== undefined && propUserVote !== userVote) {
      // The hook will handle this through its internal state
    }
  }, [propUserVote, userVote])

  // Fetch reply count when component mounts (only for evidence/perspectives)
  useEffect(() => {
    if ((isEvidenceItem || isPerspectiveItem) && itemId) {
      const fetchReplyCount = async () => {
        try {
          const params = new URLSearchParams({
            targetType: isEvidenceItem ? 'evidence' : 'perspective',
            targetId: itemId,
          })
          const response = await fetch(`/api/replies?${params.toString()}`, {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.replies) {
              setReplyCount(data.replies.length)
            }
          }
        } catch (error) {
          console.error('Error fetching reply count:', error)
        }
      }
      fetchReplyCount()
    }
  }, [isEvidenceItem, isPerspectiveItem, itemId])

  const cardType = isEvidenceItem ? 'Evidence' : isPerspectiveItem ? 'Perspective' : ''
  const cardTypeColor = isEvidenceItem 
    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
    : isPerspectiveItem 
    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
    : ''

  const titleHref = href || (
    isEvidenceItem || isPerspectiveItem
      ? effectiveClaimId 
        ? `/claims/${effectiveClaimId}`
        : undefined
      : `/claims/${itemId}`
  )

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      await vote(voteType)
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

  // Determine which badge to show based on upvotes (only for claims)
  const getBadgeImage = () => {
    if (!isClaimItem) return null
    
    if (upvotes >= 15) {
      return '/images/claim_badge_3.png'
    } else if (upvotes >= 10) {
      return '/images/claim_badge_2.png'
    } else if (upvotes >= 5) {
      return '/images/claim_badge_1.png'
    }
    return null
  }

  const badgeImage = getBadgeImage()

  return (
    <Card className={cn(
      "p-4 sm:p-6 rounded-2xl sm:rounded-[32px] relative transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 hover:-translate-y-1",
      isDropdownOpen ? "z-50" : "hover:z-10"
    )}>
      {/* Badge in top right corner (only for claims) */}
      {badgeImage && (
        <div className="absolute top-2 right-4 sm:top-4 sm:right-5 z-10 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-6">
          <Image
            src={badgeImage}
            alt="Claim badge"
            width={55}
            height={55}
            className="w-10 h-10 sm:w-12 sm:h-12"
            unoptimized
          />
        </div>
      )}
      
      <div className={cn(
        "flex items-start justify-between mb-2 sm:mb-3",
        badgeImage && "pr-12 sm:pr-16"
      )}>
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {user?.id ? (
            <Link 
              href={currentUser?.id === user.id ? '/profile' : `/users/${user.id}`}
              className="text-xs sm:text-sm text-[#030303] dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              @{user.username || 'user'}
            </Link>
          ) : (
            <span className="text-xs sm:text-sm text-[#030303] dark:text-gray-100 font-medium">@{user?.username || 'user'}</span>
          )}
        </div>
        <div className='flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-2 flex-wrap gap-y-1'>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cardTypeColor}`}>
            {cardType}
          </span>
          {/* Status badge only for claims - show "approved" only when not on Browse or Main page */}
          {isClaimItem && (item as Claim).status && (
            <>
              {(item as Claim).status === 'approved' && !shouldHideApprovedStatus ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 whitespace-nowrap">
                  <CheckIcon className="w-3 h-3" />
                  <span className="capitalize">{(item as Claim).status}</span>
                </span>
              ) : (item as Claim).status !== 'approved' ? (
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${
                  (item as Claim).status === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : (item as Claim).status === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {(item as Claim).status === 'rejected' && <FlagIcon className="w-3 h-3" />}
                  {(item as Claim).status === 'pending' && <ClockIcon className="w-3 h-3" />}
                  <span className="capitalize">{(item as Claim).status}</span>
                </span>
              ) : null}
            </>
          )}
          {showEdit && onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(itemId)
              }}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 flex-shrink-0"
              title="Edit claim"
            >
              <EditIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDeleteModal(true)
              }}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1 flex-shrink-0"
              title="Delete post"
            >
              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {/* <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">  
            <ShareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          </button> */}
        </div>
      </div>

      {displayTitle && (
        titleHref ? (
          <ProtectedLink href={titleHref}>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 leading-tight cursor-pointer">
              {displayTitle}
            </h3>
          </ProtectedLink>
        ) : (
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 leading-tight">
            {displayTitle}
          </h3>
        )
      )}

      {description && (
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <p 
              ref={descriptionRef}
              className={`text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-normal leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-2 pr-14' : ''}`}
            >
              {displayDescription}
              {isDescriptionExpanded && (
                <span className="ml-1">
                  <button
                    onClick={() => setIsDescriptionExpanded(false)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
                  >
                    read less
                  </button>
                </span>
              )}
            </p>
            {!isDescriptionExpanded && showReadMore && (
              <>
                <div className="absolute bottom-0 right-0 h-6 w-20 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="absolute bottom-0 right-0 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors pl-1"
                >
                  read more
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {user && (
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
          <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="flex flex-row items-center gap-1 sm:gap-2 flex-wrap">
            <div className="text-xs sm:text-sm text-[#030303] dark:text-gray-200 font-medium">Author:</div> 
            <span className="dark:text-gray-300">{user.firstName} {user.lastName}</span>
          </span>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mt-3 sm:mt-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="primary"
            size="sm"
            onClick={handleFollow}
            disabled={isFollowingAction}
            className="text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reply Button - Only for Evidence and Perspectives */}
            {(isEvidenceItem || isPerspectiveItem) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyModal(true)}
                className="rounded-full text-xs sm:text-sm px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2"
              >
                <span>Comments</span>
                {replyCount !== null && replyCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-xs font-medium">
                    {replyCount}
                  </span>
                )}
              </Button>
            )}

            <VoteButtons
              upvotes={upvotes}
              downvotes={downvotes}
              userVote={userVote}
              onVote={handleVote}
              disabled={isVoting}
              itemId={itemId}
              itemType={itemType}
              onDropdownChange={setIsDropdownOpen}
            />
          </div>
        </div>
      </div>

      {/* Reply Modal - Only for Evidence and Perspectives */}
      {(isEvidenceItem || isPerspectiveItem) && (
        <ReplyModal
          isOpen={showReplyModal}
          onClose={() => {
            setShowReplyModal(false)
            // Refresh reply count when modal closes
            if ((isEvidenceItem || isPerspectiveItem) && itemId) {
              const fetchReplyCount = async () => {
                try {
                  const params = new URLSearchParams({
                    targetType: isEvidenceItem ? 'evidence' : 'perspective',
                    targetId: itemId,
                  })
                  const response = await fetch(`/api/replies?${params.toString()}`, {
                    credentials: 'include',
                  })
                  if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.replies) {
                      setReplyCount(data.replies.length)
                    }
                  }
                } catch (error) {
                  console.error('Error fetching reply count:', error)
                }
              }
              fetchReplyCount()
            }
          }}
          targetType={isEvidenceItem ? 'evidence' : 'perspective'}
          targetId={itemId}
          item={item as Evidence | Perspective}
          onReplyCountChange={(count) => setReplyCount(count)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && onDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={isDeleting ? () => {} : () => setShowDeleteModal(false)}
          title="Delete Post"
          size="sm"
          showCloseButton={!isDeleting}
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2"
              >
                No
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    await onDelete(itemId, itemType)
                    setShowDeleteModal(false)
                  } catch (error) {
                    // Error is handled in onDelete callback
                    console.error('Delete error:', error)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </Button>
            </div>
          }
        >
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </Card>
  )
}


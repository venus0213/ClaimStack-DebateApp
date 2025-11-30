'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { ThumbUpIcon, ThumbDownIcon } from '@/components/ui/Icons'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { User } from '@/lib/types'

export interface VoteButtonsProps {
  upvotes: number
  downvotes: number
  userVote?: 'upvote' | 'downvote' | null
  onVote?: (voteType: 'upvote' | 'downvote') => Promise<void>
  disabled?: boolean
  itemId?: string
  itemType?: 'claim' | 'evidence' | 'perspective'
  onDropdownChange?: (isOpen: boolean) => void // Callback when dropdown opens/closes
}

interface Voter {
  id: string
  userId: string
  voteType: 'upvote' | 'downvote'
  user: User
  createdAt: Date
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  userVote: initialUserVote,
  onVote,
  disabled,
  itemId,
  itemType,
  onDropdownChange,
}) => {
  const { requireAuth } = useRequireAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(initialUserVote || null)
  const [isVoting, setIsVoting] = useState(false)
  const [showUpvoteDropdown, setShowUpvoteDropdown] = useState(false)
  const [showDownvoteDropdown, setShowDownvoteDropdown] = useState(false)
  const [upvoters, setUpvoters] = useState<Voter[]>([])
  const [downvoters, setDownvoters] = useState<Voter[]>([])
  const [loadingVoters, setLoadingVoters] = useState(false)
  const [upvoteDropdownDirection, setUpvoteDropdownDirection] = useState<'up' | 'down'>('down')
  const [downvoteDropdownDirection, setDownvoteDropdownDirection] = useState<'up' | 'down'>('down')
  const upvoteDropdownRef = useRef<HTMLDivElement>(null)
  const downvoteDropdownRef = useRef<HTMLDivElement>(null)
  const upvoteButtonRef = useRef<HTMLButtonElement>(null)
  const downvoteButtonRef = useRef<HTMLButtonElement>(null)

  // Update state when props change
  useEffect(() => {
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    setUserVote(initialUserVote || null)
  }, [initialUpvotes, initialDownvotes, initialUserVote])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (upvoteDropdownRef.current && !upvoteDropdownRef.current.contains(event.target as Node)) {
        setShowUpvoteDropdown(false)
      }
      if (downvoteDropdownRef.current && !downvoteDropdownRef.current.contains(event.target as Node)) {
        setShowDownvoteDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Notify parent when dropdown state changes
  useEffect(() => {
    const isOpen = showUpvoteDropdown || showDownvoteDropdown
    onDropdownChange?.(isOpen)
  }, [showUpvoteDropdown, showDownvoteDropdown, onDropdownChange])

  // Fetch voters when dropdown opens
  const fetchVoters = async (voteType: 'upvote' | 'downvote') => {
    if (!itemId || !itemType || loadingVoters) return

    setLoadingVoters(true)
    try {
      // Map itemType to correct API path
      const typePath = itemType === 'evidence' ? 'evidence' : `${itemType}s`
      const endpoint = `/api/${typePath}/${itemId}/voters?voteType=${voteType}`
      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          if (voteType === 'upvote') {
            setUpvoters(data.voters || [])
          } else {
            setDownvoters(data.voters || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching voters:', error)
    } finally {
      setLoadingVoters(false)
    }
  }

  // Calculate dropdown direction based on available space
  const calculateDropdownDirection = (buttonRef: React.RefObject<HTMLButtonElement>): 'up' | 'down' => {
    if (!buttonRef.current) return 'down'
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const dropdownHeight = 300 // Approximate dropdown height
    
    // If there's not enough space below but enough space above, show upward
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return 'up'
    }
    // Otherwise show downward
    return 'down'
  }

  const handleDropdownToggle = (voteType: 'upvote' | 'downvote') => {
    if (voteType === 'upvote') {
      const newState = !showUpvoteDropdown
      setShowUpvoteDropdown(newState)
      if (newState) {
        const direction = calculateDropdownDirection(upvoteButtonRef)
        setUpvoteDropdownDirection(direction)
        if (upvoters.length === 0) {
          fetchVoters('upvote')
        }
      }
      setShowDownvoteDropdown(false)
      // Notify parent about dropdown state change
      onDropdownChange?.(newState)
    } else {
      const newState = !showDownvoteDropdown
      setShowDownvoteDropdown(newState)
      if (newState) {
        const direction = calculateDropdownDirection(downvoteButtonRef)
        setDownvoteDropdownDirection(direction)
        if (downvoters.length === 0) {
          fetchVoters('downvote')
        }
      }
      setShowUpvoteDropdown(false)
      // Notify parent about dropdown state change
      onDropdownChange?.(newState)
    }
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (disabled || isVoting) return
    
    requireAuth(async () => {
      // Optimistic update - update UI first
      setIsVoting(true)
      const previousVote = userVote
      const previousUpvotes = upvotes
      const previousDownvotes = downvotes

      // Calculate new vote state optimistically
      let newUserVote: 'upvote' | 'downvote' | null = voteType
      let newUpvotes = upvotes
      let newDownvotes = downvotes

      if (previousVote === voteType) {
        // Toggle off - remove vote
        newUserVote = null
        if (voteType === 'upvote') {
          newUpvotes = Math.max(0, upvotes - 1)
        } else {
          newDownvotes = Math.max(0, downvotes - 1)
        }
      } else if (previousVote) {
        // Switch vote type
        if (previousVote === 'upvote') {
          newUpvotes = Math.max(0, upvotes - 1)
        } else {
          newDownvotes = Math.max(0, downvotes - 1)
        }
        if (voteType === 'upvote') {
          newUpvotes += 1
        } else {
          newDownvotes += 1
        }
      } else {
        // New vote
        if (voteType === 'upvote') {
          newUpvotes += 1
        } else {
          newDownvotes += 1
        }
      }

      // Update UI immediately
      setUpvotes(newUpvotes)
      setDownvotes(newDownvotes)
      setUserVote(newUserVote)

      try {
        // Then update backend
        await onVote?.(voteType)
        
        // Refresh voters list if dropdown is open
        if (voteType === 'upvote' && showUpvoteDropdown) {
          setUpvoters([]) // Clear to force refresh
          fetchVoters('upvote')
        } else if (voteType === 'downvote' && showDownvoteDropdown) {
          setDownvoters([]) // Clear to force refresh
          fetchVoters('downvote')
        }
      } catch (error) {
        // Revert on error
        setUpvotes(previousUpvotes)
        setDownvotes(previousDownvotes)
        setUserVote(previousVote)
        console.error('Error voting:', error)
      } finally {
        setIsVoting(false)
      }
    })
  }

  const renderVoterList = (voters: Voter[], voteType: 'upvote' | 'downvote') => {
    if (loadingVoters) {
      return (
        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Loading...
        </div>
      )
    }

    if (voters.length === 0) {
      return (
        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          No {voteType === 'upvote' ? 'upvoters' : 'downvoters'} yet
        </div>
      )
    }

    return (
      <div className="max-h-60 overflow-y-auto">
        {voters.map((voter) => (
          <div
            key={voter.id}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {voter.user.avatarUrl ? (
              <img
                src={voter.user.avatarUrl}
                alt={voter.user.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {voter.user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              @{voter.user.username}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Upvote Button with Dropdown */}
      <div ref={upvoteDropdownRef} className="relative z-[100]">
        <button
          ref={upvoteButtonRef}
          onClick={(e) => {
            e.stopPropagation()
            handleDropdownToggle('upvote')
          }}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors',
            userVote === 'upvote'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-xs sm:text-sm font-medium">+{upvotes}</span>
          <ThumbUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {showUpvoteDropdown && (
          <div className={cn(
            'absolute right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg z-[100]',
            upvoteDropdownDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}>
            {/* Vote Button at Top */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleVote('upvote')
                  setShowUpvoteDropdown(false)
                }}
                disabled={disabled || isVoting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border transition-colors',
                  userVote === 'upvote'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                    : 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-600',
                  (disabled || isVoting) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ThumbUpIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {userVote === 'upvote' ? 'Remove Upvote' : 'Upvote'}
                </span>
              </button>
            </div>
            {/* Voters List */}
            {renderVoterList(upvoters, 'upvote')}
          </div>
        )}
      </div>

      {/* Downvote Button with Dropdown */}
      <div ref={downvoteDropdownRef} className="relative z-[100]">
        <button
          ref={downvoteButtonRef}
          onClick={(e) => {
            e.stopPropagation()
            handleDropdownToggle('downvote')
          }}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors',
            userVote === 'downvote'
              ? 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-400'
              : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:border-red-400 dark:hover:border-red-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-xs sm:text-sm font-medium">+{downvotes}</span>
          <ThumbDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {showDownvoteDropdown && (
          <div className={cn(
            'absolute right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg z-[100]',
            downvoteDropdownDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}>
            {/* Vote Button at Top */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleVote('downvote')
                  setShowDownvoteDropdown(false)
                }}
                disabled={disabled || isVoting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border transition-colors',
                  userVote === 'downvote'
                    ? 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900'
                    : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:border-red-400 dark:hover:border-red-600',
                  (disabled || isVoting) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ThumbDownIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {userVote === 'downvote' ? 'Remove Downvote' : 'Downvote'}
                </span>
              </button>
            </div>
            {/* Voters List */}
            {renderVoterList(downvoters, 'downvote')}
          </div>
        )}
      </div>
    </div>
  )
}


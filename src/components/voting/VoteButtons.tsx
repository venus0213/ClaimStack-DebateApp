'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { ThumbUpIcon, ThumbDownIcon } from '@/components/ui/Icons'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export interface VoteButtonsProps {
  upvotes: number
  downvotes: number
  userVote?: 'upvote' | 'downvote' | null
  onVote?: (voteType: 'upvote' | 'downvote') => Promise<void>
  disabled?: boolean
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  userVote: initialUserVote,
  onVote,
  disabled,
}) => {
  const { requireAuth } = useRequireAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(initialUserVote || null)
  const [isVoting, setIsVoting] = useState(false)

  // Update state when props change
  useEffect(() => {
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    setUserVote(initialUserVote || null)
  }, [initialUpvotes, initialDownvotes, initialUserVote])

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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={() => handleVote('upvote')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors',
          userVote === 'upvote'
            ? 'border-blue-600 text-blue-600'
            : 'border-blue-200 text-blue-600 hover:border-blue-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-xs sm:text-sm font-medium">+{upvotes}</span>
        <ThumbUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => handleVote('downvote')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors',
          userVote === 'downvote'
            ? 'border-red-600 text-red-600'
            : 'border-red-200 text-red-600 hover:border-red-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-xs sm:text-sm font-medium">+{downvotes}</span>
        <ThumbDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  )
}


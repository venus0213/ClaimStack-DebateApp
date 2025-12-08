'use client'

import React from 'react'
import Link from 'next/link'
import { Reply } from '@/lib/types'
import { VoteButtons } from '@/components/voting/VoteButtons'
import { LinkDisplay } from './LinkDisplay'
import { useVote } from '@/hooks/useVote'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'

interface ReplyCardProps {
  reply: Reply
  onVote?: (replyId: string, voteType: 'upvote' | 'downvote') => void
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, onVote }) => {
  const { user: currentUser } = useAuth()

  const { upvotes, downvotes, userVote, isVoting, vote } = useVote({
    itemId: reply.id,
    itemType: 'reply',
    currentUpvotes: reply.upvotes,
    currentDownvotes: reply.downvotes,
    currentUserVote: reply.userVote || null,
  })

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      await vote(voteType)
      onVote?.(reply.id, voteType)
    } catch (error) {
      console.error('Error voting on reply:', error)
    }
  }

  const user = reply.user
  const isOwnReply = currentUser && user && currentUser.id === user.id

  // Check if links exist and are valid
  const hasLinks = reply.links && Array.isArray(reply.links) && reply.links.length > 0

  return (
    <div className={cn(
      "bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4",
      "transition-all duration-200 hover:shadow-md dark:hover:shadow-lg"
    )}>
      {/* Author Info */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2">
          {user?.id ? (
            <Link
              href={currentUser?.id === user.id ? '/profile' : `/users/${user.id}`}
              className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              @{user.username || 'user'}
            </Link>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
              @{user?.username || 'user'}
            </span>
          )}
          {isOwnReply && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              You
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(reply.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Reply Body */}
      <div className="mb-3 sm:mb-4">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
          {reply.body}
        </p>
      </div>

      {/* Links Display */}
      {hasLinks && reply.links && (
        <div className="mb-3 sm:mb-4">
          <LinkDisplay links={reply.links} />
        </div>
      )}

      {/* Vote Buttons */}
      <div className="flex items-center justify-end pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
        <VoteButtons
          upvotes={upvotes}
          downvotes={downvotes}
          userVote={userVote}
          onVote={handleVote}
          disabled={isVoting}
          itemId={reply.id}
          itemType="reply"
        />
      </div>
    </div>
  )
}


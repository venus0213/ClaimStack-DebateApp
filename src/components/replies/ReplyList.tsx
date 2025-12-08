'use client'

import React, { useState, useEffect } from 'react'
import { Reply } from '@/lib/types'
import { ReplyCard } from './ReplyCard'
import { ReplyForm } from './ReplyForm'
import { Button } from '@/components/ui/Button'
import { ChevronDownIcon, ChevronUpIcon } from '@/components/ui/Icons'
import { cn } from '@/lib/utils/cn'

interface ReplyListProps {
  targetType: 'evidence' | 'perspective'
  targetId: string
  initialReplies?: Reply[]
  className?: string
  showReplyForm?: boolean
  onReplyCreated?: (reply: Reply) => void
  isInModal?: boolean // When true, always expanded and shows form by default
}

export const ReplyList: React.FC<ReplyListProps> = ({
  targetType,
  targetId,
  initialReplies = [],
  className,
  showReplyForm: initialShowReplyForm = false,
  onReplyCreated,
  isInModal = false,
}) => {
  const [replies, setReplies] = useState<Reply[]>(initialReplies)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(isInModal || initialReplies.length > 0)
  const [showReplyForm, setShowReplyForm] = useState(isInModal || initialShowReplyForm)
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score')

  const fetchReplies = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        targetType,
        targetId,
        sort: sortBy,
      })

      const response = await fetch(`/api/replies?${params.toString()}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch replies')
      }

      setReplies(data.replies || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch replies'
      setError(errorMessage)
      console.error('Error fetching replies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isExpanded) {
      fetchReplies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId, sortBy, isExpanded])

  const handleReplyCreated = (newReply: Reply) => {
    setReplies((prev) => {
      const updated = [newReply, ...prev]
      // Update reply count
      return updated
    })
    if (!isInModal) {
      setShowReplyForm(false)
    }
    setIsExpanded(true)
    onReplyCreated?.(newReply)
  }

  const handleVote = async (replyId: string, voteType: 'upvote' | 'downvote') => {
    // Optimistically update the reply in the list
    setReplies((prev) =>
      prev.map((reply) => {
        if (reply.id === replyId) {
          const newUpvotes = voteType === 'upvote' ? reply.upvotes + 1 : reply.upvotes
          const newDownvotes = voteType === 'downvote' ? reply.downvotes + 1 : reply.downvotes
          return {
            ...reply,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            score: newUpvotes - newDownvotes,
            userVote: voteType,
          }
        }
        return reply
      })
    )

    // Refetch to get accurate counts
    setTimeout(() => {
      fetchReplies()
    }, 500)
  }

  const replyCount = replies.length

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Header with Reply Button */}
      {!isInModal && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <span>
                {replyCount === 0 ? 'No' : replyCount} {replyCount === 1 ? 'Comment' : 'Comments'}
              </span>
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {isExpanded && replyCount > 0 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setSortBy('score')}
                  className={cn(
                    'text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border transition-colors',
                    sortBy === 'score'
                      ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  Top
                </button>
                <button
                  onClick={() => setSortBy('recent')}
                  className={cn(
                    'text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border transition-colors',
                    sortBy === 'recent'
                      ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  Recent
                </button>
              </div>
            )}
          </div>

          {!showReplyForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowReplyForm(true)
                setIsExpanded(true)
              }}
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
            >
              Comments
            </Button>
          )}
        </div>
      )}

      {/* Modal Header */}
      {isInModal && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {replyCount === 0 ? 'No' : replyCount} {replyCount === 1 ? 'Comment' : 'Comments'}
          </h3>
          {replyCount > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSortBy('score')}
                className={cn(
                  'text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border transition-colors',
                  sortBy === 'score'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                )}
              >
                Top
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={cn(
                  'text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border transition-colors',
                  sortBy === 'recent'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                )}
              >
                Recent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <ReplyForm
            targetType={targetType}
            targetId={targetId}
            onSubmit={handleReplyCreated}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies List */}
      {isExpanded && (
        <div className="space-y-2 sm:space-y-3">
          {loading ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading replies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-sm sm:text-base text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReplies}
                className="mt-2 text-xs sm:text-sm"
              >
                Comment
              </Button>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                No replies yet. Be the first to reply!
              </p>
            </div>
          ) : (
            replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} onVote={handleVote} />
            ))
          )}
        </div>
      )}
    </div>
  )
}


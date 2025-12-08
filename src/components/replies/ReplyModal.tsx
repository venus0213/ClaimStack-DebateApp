'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { ReplyList } from './ReplyList'
import { Evidence, Perspective } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

interface ReplyModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'evidence' | 'perspective'
  targetId: string
  item: Evidence | Perspective
  onReplyCountChange?: (count: number) => void
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  item,
  onReplyCountChange,
}) => {
  const itemTitle = item.title || (targetType === 'perspective' ? (item as Perspective).body?.substring(0, 50) + '...' : 'Untitled')
  const itemDescription = targetType === 'perspective' 
    ? (item as Perspective).body 
    : (item as Evidence).description

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Replies
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {targetType === 'evidence' ? 'Evidence' : 'Perspective'} by @{item.user?.username || 'user'}
          </div>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Original Content Preview */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              targetType === 'evidence'
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
            )}>
              {targetType === 'evidence' ? 'Evidence' : 'Perspective'}
            </span>
            {item.position && (
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                item.position === 'for'
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
              )}>
                {item.position === 'for' ? 'For' : 'Against'}
              </span>
            )}
          </div>
          
          {itemTitle && (
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
              {itemTitle}
            </h3>
          )}
          
          {itemDescription && (
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
              {itemDescription}
            </p>
          )}
        </div>

        {/* Replies Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
          <ReplyList
            targetType={targetType}
            targetId={targetId}
            showReplyForm={true}
            isInModal={true}
            onReplyCreated={(reply) => {
              // Update reply count in parent
              if (onReplyCountChange) {
                // The ReplyList will fetch and update, but we can also trigger a refresh
                setTimeout(() => {
                  const fetchCount = async () => {
                    try {
                      const params = new URLSearchParams({
                        targetType,
                        targetId,
                      })
                      const response = await fetch(`/api/replies?${params.toString()}`, {
                        credentials: 'include',
                      })
                      if (response.ok) {
                        const data = await response.json()
                        if (data.success && data.replies) {
                          onReplyCountChange(data.replies.length)
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching reply count:', error)
                    }
                  }
                  fetchCount()
                }, 500)
              }
            }}
          />
        </div>
      </div>
    </Modal>
  )
}


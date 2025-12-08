'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Reply } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

interface ReplyFormProps {
  targetType: 'evidence' | 'perspective'
  targetId: string
  onSubmit: (reply: Reply) => void
  onCancel?: () => void
  className?: string
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  targetType,
  targetId,
  onSubmit,
  onCancel,
  className,
}) => {
  const { requireAuth } = useRequireAuth()
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!body.trim()) {
      setError('Reply cannot be empty')
      return
    }

    if (body.trim().length < 10) {
      setError('Reply must be at least 10 characters')
      return
    }

    if (body.trim().length > 2000) {
      setError('Reply must be at most 2000 characters')
      return
    }

    requireAuth(async () => {
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await fetch('/api/replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            targetType,
            targetId,
            body: body.trim(),
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to create reply')
        }

        // Call onSubmit callback with the new reply
        onSubmit(data.reply)
        
        // Reset form
        setBody('')
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create reply'
        setError(errorMessage)
        console.error('Error creating reply:', err)
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  const handleCancel = () => {
    setBody('')
    setError(null)
    onCancel?.()
  }

  const characterCount = body.length
  const maxLength = 2000
  const minLength = 10
  const isLengthValid = characterCount >= minLength && characterCount <= maxLength

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 sm:space-y-4', className)}>
      <div>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setError(null)
          }}
          placeholder={`Write your reply... (min ${minLength} characters)`}
          className={cn(
            'w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border',
            'text-sm sm:text-base text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
            'focus:border-transparent',
            'resize-none',
            'min-h-[100px] sm:min-h-[120px]',
            error && 'border-red-500 dark:border-red-400'
          )}
          rows={4}
          maxLength={maxLength}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between mt-1 sm:mt-2">
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</span>
            )}
            {!error && !isLengthValid && characterCount > 0 && (
              <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                {characterCount < minLength
                  ? `At least ${minLength - characterCount} more characters needed`
                  : `Maximum ${maxLength} characters`}
              </span>
            )}
          </div>
          <span
            className={cn(
              'text-xs sm:text-sm',
              characterCount > maxLength
                ? 'text-red-600 dark:text-red-400'
                : characterCount >= minLength
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !isLengthValid || !body.trim()}
          className="text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-full"
        >
          {isSubmitting ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </form>
  )
}


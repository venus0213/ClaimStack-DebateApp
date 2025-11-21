import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  maxLength?: number
  showCharCount?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, maxLength, showCharCount, id, value, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            maxLength={maxLength}
            value={value}
            className={cn(
              'w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y pr-8',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300',
              className
            )}
            {...props}
          />
        </div>
        <div className="flex justify-between items-center mt-1 gap-2">
          <div className="flex-1 min-w-0">
            {error && (
              <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">●</span>
                <span className="break-words">{error}</span>
              </p>
            )}
            {helperText && !error && (
              <p className="text-xs sm:text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
              {charCount}/{maxLength} Symbols
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'


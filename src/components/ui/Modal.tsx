'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'
import { XIcon } from './Icons'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' |'xl2'
  showCloseButton?: boolean
  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    xl2: 'max-w-5xl',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[32px] shadow-xl w-full',
          sizes[size as keyof typeof sizes],
          'max-h-[95vh] sm:max-h-[90vh] overflow-y-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pt-4 sm:pt-6 pb-2 px-4 sm:px-6 lg:px-10 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 pr-2">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        )}
        <div className="py-4 sm:py-6 px-4 sm:px-6 lg:px-10">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  return null
}


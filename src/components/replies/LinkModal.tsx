'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { MediaDisplay } from '@/components/moderation/MediaDisplay'
import { LinkIcon } from '@/components/ui/Icons'

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  url,
}) => {
  const getDisplayName = (url: string): string => {
    try {
      const urlObj = new URL(url)
      let hostname = urlObj.hostname.replace(/^www\./, '')
      const pathname = urlObj.pathname
      if (pathname && pathname !== '/') {
        const segments = pathname.split('/').filter(Boolean)
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1]
          const name = decodeURIComponent(lastSegment).replace(/\.[^/.]+$/, '')
          return name.length > 50 ? name.substring(0, 50) + '...' : name
        }
      }
      return hostname.length > 50 ? hostname.substring(0, 50) + '...' : hostname
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url
    }
  }

  const displayName = getDisplayName(url)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 truncate">
            {displayName}
          </span>
        </div>
      }
    >
      <div className="w-full">
        <MediaDisplay
          url={url}
          title={displayName}
        />
      </div>
    </Modal>
  )
}


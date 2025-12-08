'use client'

import React, { useState } from 'react'
import { LinkIcon } from '@/components/ui/Icons'
import { LinkModal } from './LinkModal'
import { cn } from '@/lib/utils/cn'

interface LinkDisplayProps {
  links: string[]
  className?: string
}

export const LinkDisplay: React.FC<LinkDisplayProps> = ({ links, className }) => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const validLinks = Array.isArray(links) 
    ? links.filter(link => link && typeof link === 'string' && link.trim().length > 0)
    : []

  if (validLinks.length === 0) {
    return null
  }

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault()
    setSelectedLink(link)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLink(null)
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 mb-2">
        </div>
        <div className="flex flex-wrap gap-2">
          {validLinks.map((link, index) => {
            return (
              <button
                key={index}
                onClick={(e) => handleLinkClick(e, link)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 sm:px-4',
                  'rounded-lg',
                  'transition-all group',
                  'text-xs sm:text-sm font-medium',
                  'cursor-pointer',
                  'active:scale-95'
                )}
                title={`Click to view: ${link}`}
              >
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200 truncate max-w-[180px] sm:max-w-[220px]">
                  {link}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedLink && (
        <LinkModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          url={selectedLink}
        />
      )}
    </>
  )
}


'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { XIcon, PlusIcon, LinkIcon } from '@/components/ui/Icons'
import { cn } from '@/lib/utils/cn'

interface LinkInputProps {
  links: string[]
  onChange: (links: string[]) => void
  maxLinks?: number
  className?: string
}

export const LinkInput: React.FC<LinkInputProps> = ({
  links,
  onChange,
  maxLinks = 1,
  className,
}) => {
  const [newLink, setNewLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return false
    try {
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`
      const urlObj = new URL(urlWithProtocol)
      return urlObj.hostname.length > 0 && urlObj.hostname.includes('.')
    } catch {
      return false
    }
  }

  const handleAddLink = () => {
    const trimmedLink = newLink.trim()
    
    if (!trimmedLink) {
      setError('Please enter a URL')
      return
    }

    if (!validateUrl(trimmedLink)) {
      setError('Please enter a valid URL')
      return
    }

    const linkWithProtocol = trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')
      ? trimmedLink
      : `https://${trimmedLink}`

    const normalizedLink = linkWithProtocol.toLowerCase()
    if (links.some(link => link.toLowerCase() === normalizedLink)) {
      setError('This link has already been added')
      return
    }

    if (maxLinks === 1 && links.length >= 1) {
      onChange([linkWithProtocol])
    } else if (links.length >= maxLinks) {
      setError(`Only ${maxLinks} link allowed. Please remove the existing link first.`)
      return
    } else {
      onChange([...links, linkWithProtocol])
    }

    setNewLink('')
    setError(null)
  }

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index)
    onChange(updatedLinks)
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLink()
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
        <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
          Link <span className="text-gray-500 dark:text-gray-400">(optional)</span>
        </label>
      </div>

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all underline truncate"
                title={link}
              >
                {link}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveLink(index)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Remove link"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Link */}
      {links.length < maxLinks && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://example.com"
              value={newLink}
              onChange={(e) => {
                setNewLink(e.target.value)
                setError(null)
              }}
              onKeyPress={handleKeyPress}
              className="flex-1 rounded-full text-xs sm:text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLink}
              className="px-3 sm:px-4 py-2 rounded-full flex items-center gap-1.5 sm:gap-2"
              disabled={!newLink.trim()}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Add</span>
            </Button>
          </div>
          {error && (
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {links.length > 0 ? 'Link added' : 'No link added'}
          </p>
        </div>
      )}

      {links.length >= maxLinks && maxLinks === 1 && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Link added. Enter a new link to replace it.
        </p>
      )}
    </div>
  )
}


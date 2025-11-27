/**
 * Icons Module
 * 
 * Centralized icon exports from react-icons package.
 * All icons are re-exported with consistent naming for easy use across the app.
 * 
 * Usage examples:
 * ```tsx
 * import { GoogleIcon, FilterIcon, ThumbUpIcon, SearchIcon } from '@/components/ui/Icons'
 * 
 * // Or import from the main UI index:
 * import { GoogleIcon, FilterIcon } from '@/components/ui'
 * 
 * // Use in components:
 * <GoogleIcon className="w-5 h-5" />
 * <FilterIcon className="w-4 h-4" />
 * <ThumbUpIcon className="w-6 h-6 text-blue-500" />
 * ```
 */

import React from 'react'
import {
  // Heroicons - Outline
  HiOutlineFilter,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineThumbUp,
  HiOutlineThumbDown,
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineHeart,
  HiOutlineBookmark,
  HiOutlineShare,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineMenu,
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlinePencil,
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineQuestionMarkCircle,
  HiOutlineLink,
  HiOutlineChat,
  HiOutlinePaperClip,
  HiOutlineTrendingUp,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineTrash,
  // Heroicons - Solid
  HiThumbUp,
  HiThumbDown,
  HiHeart,
  HiBookmark,
  HiBell,
} from 'react-icons/hi'
import {
  // Material Design
  MdFilterList,
  MdSort,
  MdArrowUpward,
  MdArrowDownward,
  MdSearch,
  MdClose,
  MdCheck,
  MdAdd,
  MdRemove,
} from 'react-icons/md'
import {
  // Font Awesome
  FaThumbsUp,
  FaThumbsDown,
  FaHeart,
  FaBookmark,
  FaShare,
  FaFilePdf,
} from 'react-icons/fa'

// Re-export commonly used icons with consistent naming
export {
  // Filter & Sort
  HiOutlineFilter as FilterIcon,
  HiOutlineSortAscending as SortAscIcon,
  HiOutlineSortDescending as SortDescIcon,
  MdFilterList as FilterListIcon,
  MdSort as SortIcon,
  MdArrowUpward as ArrowUpIcon,
  MdArrowDownward as ArrowDownIcon,
  
  // Voting/Interaction
  HiOutlineThumbUp as ThumbUpOutlineIcon,
  HiOutlineThumbDown as ThumbDownOutlineIcon,
  HiThumbUp as ThumbUpIcon,
  HiThumbDown as ThumbDownIcon,
  FaThumbsUp as ThumbUpFilledIcon,
  FaThumbsDown as ThumbDownFilledIcon,
  
  // Actions
  HiOutlineSearch as SearchIcon,
  HiOutlineBell as BellOutlineIcon,
  HiBell as BellIcon,
  HiOutlineHeart as HeartOutlineIcon,
  HiHeart as HeartIcon,
  FaHeart as HeartFilledIcon,
  HiOutlineBookmark as BookmarkOutlineIcon,
  HiBookmark as BookmarkIcon,
  FaBookmark as BookmarkFilledIcon,
  HiOutlineShare as ShareIcon,
  FaShare as ShareFilledIcon,
  
  // Navigation
  HiOutlineChevronDown as ChevronDownIcon,
  HiOutlineChevronUp as ChevronUpIcon,
  HiOutlineChevronLeft as ChevronLeftIcon,
  HiOutlineChevronRight as ChevronRightIcon,
  HiOutlineMenu as MenuIcon,
  HiOutlineHome as HomeIcon,
  HiOutlineUser as UserIcon,
  HiOutlineCog as SettingsIcon,
  HiOutlineLogout as LogoutIcon,
  HiOutlinePencil as EditIcon,
  HiOutlineClock as ClockIcon,
  HiOutlineFlag as FlagIcon,
  HiOutlineQuestionMarkCircle as QuestionMarkIcon,
  HiOutlineLink as LinkIcon,
  HiOutlineChat as ChatIcon,
  HiOutlinePaperClip as PaperClipIcon,
  HiOutlineTrendingUp as TrendingUpIcon,
  HiOutlineSparkles as SparklesIcon,
  HiOutlineDocumentText as DocumentIcon,
  HiOutlineTrash as TrashIcon,
  FaFilePdf as PdfIcon,
  
  // UI Elements
  HiOutlineX as XIcon,
  HiOutlineCheck as CheckIcon,
  HiOutlinePlus as PlusIcon,
  HiOutlineMinus as MinusIcon,
  MdClose as CloseIcon,
  MdCheck as CheckFilledIcon,
  MdAdd as AddIcon,
  MdRemove as RemoveIcon,
  MdSearch as SearchFilledIcon,
}

// Checkmark Icon Component
export interface CheckmarkIconProps {
  className?: string
  size?: number | string
}

export const CheckmarkIcon: React.FC<CheckmarkIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 20 20'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Checkmark"
    >
      {/* Circular outline */}
      <circle
        cx="10"
        cy="10"
        r="9"
        stroke="#2563eb"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Checkmark */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        fill="#2563eb"
      />
    </svg>
  )
}

// Colored Google Icon Component
export interface GoogleIconProps {
  className?: string
  size?: number | string
}

export const GoogleIcon: React.FC<GoogleIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 24 24'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google"
    >
      <path 
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
        fill="#4285F4"
      />
      <path 
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
        fill="#34A853"
      />
      <path 
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
        fill="#FBBC05"
      />
      <path 
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
        fill="#EA4335"
      />
    </svg>
  )
}

// Platform Icon Components
export interface PlatformIconProps {
  className?: string
  size?: number | string
}

export const TikTokIcon: React.FC<PlatformIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 24 24'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TikTok"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

export const InstagramIcon: React.FC<PlatformIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 24 24'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Instagram"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

export const YouTubeIcon: React.FC<PlatformIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 24 24'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="YouTube"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

export const TwitterXIcon: React.FC<PlatformIconProps> = ({ 
  className = 'w-5 h-5', 
  size 
}) => {
  const viewBox = '0 0 24 24'
  const width = size || undefined
  const height = size || undefined

  return (
    <svg 
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Twitter/X"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}


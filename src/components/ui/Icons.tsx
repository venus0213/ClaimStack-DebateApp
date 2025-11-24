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


'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { HiOutlineExclamationCircle } from 'react-icons/hi'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  disabled,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border rounded-full focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 dark:text-gray-100',
          error
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400',
          disabled && 'opacity-50 cursor-not-allowed',
          'flex items-center justify-between'
        )}
      >
        <span className={cn(!selectedOption && 'text-gray-500 dark:text-gray-400 text-sm')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={cn('w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform', isOpen && 'transform rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value)
                  setIsOpen(false)
                }
              }}
              disabled={option.disabled}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100',
                value === option.value && 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-1 flex items-center gap-1">
          <HiOutlineExclamationCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}


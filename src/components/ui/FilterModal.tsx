'use client'

import React, { useState, useEffect } from 'react'
import { Dropdown, DropdownOption } from './Dropdown'
import { Button } from './Button'
import { XIcon } from './Icons'

export interface FilterValues {
  category: string
  date: string
  evidenceAttached: string
  yourInteractions: string
}

export interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterValues) => void
  initialFilters?: FilterValues
}

const categoryOptions: DropdownOption[] = [
  { value: 'all', label: 'All' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' },
  { value: 'politics', label: 'Politics' },
  { value: 'education', label: 'Education' },
]

const dateOptions: DropdownOption[] = [
  { value: 'all', label: 'All Time' },
  { value: 'last-24h', label: 'Last 24h' },
  { value: 'last-7d', label: 'Last 7 days' },
  { value: 'last-30d', label: 'Last 30 days' },
  { value: 'last-year', label: 'Last year' },
]

const evidenceOptions: DropdownOption[] = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const interactionOptions: DropdownOption[] = [
  { value: 'all', label: 'All' },
  { value: 'followed', label: 'Followed' },
  { value: 'not-followed', label: 'Not Followed' },
  { value: 'voted', label: 'Voted' },
  { value: 'commented', label: 'Commented' },
]

const defaultFilters: FilterValues = {
  category: 'technology',
  date: 'last-24h',
  evidenceAttached: 'all',
  yourInteractions: 'followed',
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = defaultFilters,
}) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters)

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black bg-opacity-50"
        onClick={onClose}
      />
      {/* Filter Modal - centered modal on mobile, dropdown on desktop */}
      <div 
        className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-1/2 sm:top-auto -translate-y-1/2 sm:translate-y-0 sm:mt-2 w-[calc(100%-2rem)] sm:w-96 max-h-[90vh] sm:max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-[101] overflow-y-auto isolate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col p-4 sm:p-6">
          {/* Header with title and close button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="space-y-5">
            {/* Select Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Category
              </label>
              <Dropdown
                options={categoryOptions}
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
                placeholder="Select Category"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <Dropdown
                options={dateOptions}
                value={filters.date}
                onChange={(value) => setFilters({ ...filters, date: value })}
                placeholder="Select Date"
              />
            </div>

            {/* Evidence Attached */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence Attached
              </label>
              <Dropdown
                options={evidenceOptions}
                value={filters.evidenceAttached}
                onChange={(value) => setFilters({ ...filters, evidenceAttached: value })}
                placeholder="Select Evidence"
              />
            </div>

            {/* Your Interactions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Interactions
              </label>
              <Dropdown
                options={interactionOptions}
                value={filters.yourInteractions}
                onChange={(value) => setFilters({ ...filters, yourInteractions: value })}
                placeholder="Select Interaction"
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleApply}
              variant="primary"
              className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-medium"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}


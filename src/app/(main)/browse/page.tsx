'use client'

import React, { useState, useEffect } from 'react'
import { ContentCard } from '@/components/content/ContentCard'
import { Claim } from '@/lib/types'
import { SearchIcon } from '@/components/ui/Icons'
import { FilterButton } from '@/components/ui/FilterButton'
import { FilterValues } from '@/components/ui/FilterModal'
import { useClaimsStore } from '@/store/claimsStore'
import { TopUsers } from '@/components/users/TopUsers'
import { PopularClaimsCarousel } from '@/components/claims/PopularClaimsCarousel'

const sortOptions = [
  { id: 'newest', label: 'Newest' },
  { id: 'most-voted', label: 'Most Voted' },
  { id: 'most-viewed', label: 'Most Viewed' },
  { id: 'most-followed', label: 'Most Followed' },
  { id: 'oldest', label: 'Oldest' },
]

export default function BrowsePage() {
  const { claims, isLoading, error, fetchApprovedClaims } = useClaimsStore()
  const [activeTab, setActiveTab] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterValues | null>(null)

  // Fetch approved claims on mount
  useEffect(() => {
    fetchApprovedClaims({ refresh: true })
  }, [fetchApprovedClaims])

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    // Apply filters to your data here
    console.log('Filters applied:', newFilters)
  }

  const filteredClaims = claims.filter((claim) => {
    if (claim.status !== 'approved') return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      claim.title.toLowerCase().includes(query) ||
      claim.description?.toLowerCase().includes(query) ||
      claim.user?.username.toLowerCase().includes(query)
    )
  })

  // Sort claims based on activeTab
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    switch (activeTab) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      
      case 'most-voted':
        const aVotes = a.upvotes || 0
        const bVotes = b.upvotes || 0
        if (bVotes !== aVotes) {
          return bVotes - aVotes
        }
        // Secondary sort by newest if votes are equal
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      
      case 'most-viewed':
        const aViews = a.viewCount || 0
        const bViews = b.viewCount || 0
        return bViews - aViews
      
      case 'most-followed':
        const aFollows = a.followCount || 0
        const bFollows = b.followCount || 0
        if (bFollows !== aFollows) {
          return bFollows - aFollows
        }
        // Secondary sort by newest if follows are equal
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      
      default:
        return 0
    }
  })

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[46px] font-semibold text-[#030303]">Browse Claims</h1>
          <div className="flex-1 w-full sm:max-w-full sm:ml-4 lg:ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search claims, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-4'>
          <div className='w-full sm:w-1/2'>
            <TopUsers />
          </div>
          <div className='w-full sm:w-1/2'>
            <PopularClaimsCarousel className='sm:mt-8'/>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scroll-smooth scrollbar-hide">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`px-3 sm:px-4 py-[6px] rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
                  activeTab === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end sm:justify-start">
            <FilterButton 
              onFiltersChange={handleFiltersChange}
              buttonClassName="text-xs sm:text-sm px-3 sm:px-4"
              iconSize="w-4 h-4 sm:w-5 sm:h-5"
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading approved claims...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && sortedClaims.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No approved claims found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {sortedClaims.map((claim) => (
            <ContentCard key={claim.id} item={claim} />
          ))}
        </div>
      </div>
    </div>
  )
}


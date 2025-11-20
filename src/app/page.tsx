'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ContentCard } from '@/components/content/ContentCard'
import { Claim } from '@/lib/types'
import Image from 'next/image'
import { SortAscIcon } from '@/components/ui/Icons'
import { FilterButton } from '@/components/ui/FilterButton'
import { FilterValues } from '@/components/ui/FilterModal'
import { ProtectedLink } from '@/components/ui/ProtectedLink'
import { useClaimsStore } from '@/store/claimsStore'
import { useAuth } from '@/hooks/useAuth'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { claims, isLoading, error, fetchApprovedClaims } = useClaimsStore()
  const { isAuthenticated } = useAuth()
  const { requireAuth } = useRequireAuth()
  const router = useRouter()
  const [activeButton, setActiveButton] = useState<'sort' | 'recent'>('recent')
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

  const handleShowMore = () => {
    if (isAuthenticated) {
      // Navigate to browse page when logged in
      router.push('/browse')
    } else {
      // Show login modal when not logged in
      requireAuth()
    }
  }

  // Limit to 6 claims for the home page (always, regardless of login status)
  const displayedClaims = claims.slice(0, 6)

  return (
    <div className="bg-gray-50 relative">
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 'min(1109px, 100vh)',
          background: 'linear-gradient(to bottom,#eef4ff, rgba(16, 102, 222, 0))',
        }}
      />
      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[64px] max-w-4xl mx-auto font-bold text-gray-900 mb-3 sm:mb-4 leading-tight sm:leading-[1.5] px-2">
              Shape the Arguments That Shape the World
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 px-4">
              Fight back against misinformation. Push truth to the top
            </p>
            <Button variant="primary" size="base" className="border border-blue-300 border-solid rounded-full px-6 sm:px-10" asChild>
              <ProtectedLink href="/browse">Browse and Contribute</ProtectedLink>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="pb-8 sm:pb-12 lg:pb-16 relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 sm:mb-4">How ClaimStack Works</h2>
            <p className="text-base sm:text-lg md:text-xl font-medium text-gray-600 pb-4 sm:pb-[20px] px-4">
              Choose a side, stack the evidence, and let the best argument win.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] rounded-lg flex items-center justify-center relative order-2 md:order-1">
              <Image
                src="/images/claimstack-mindshare.png"
                alt="ClaimStack AI - Debate Platform"
                fill
                className="object-contain"
                priority
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="order-1 md:order-2 px-2 sm:px-0">
              <p className="text-base sm:text-lg md:text-xl font-normal text-gray-700 leading-relaxed mb-4">
                In the sea of online debates, valuable arguments often get lost or go unheard.
                ClaimStack simplifies these discussions, bringing both sides of any topic into
                focus.
              </p>
              <p className="text-base sm:text-lg md:text-xl font-normal text-gray-700 leading-relaxed mb-4">
                Upload link, or share evidence from videos and articles to social media posts.
                Vote on the evidence that makes the strongest case. The best arguments rise to the
                top, and our AI synthesizes them into clear, unbiased summaries you can trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Claim Feed Section */}
      <section className="py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6">Claim Feed</h2>
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8 pt-3 sm:pt-5 flex-wrap">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
              <Button
                variant="outline"
                size="baseFull"
                onClick={() => setActiveButton('sort')}
                className={`flex round-full items-center space-x-2 text-xs sm:text-sm px-3 sm:px-4 ${
                  activeButton === 'sort'
                    ? '!border-blue-600 !text-blue-600 bg-blue-50'
                    : '!border-gray-300 bg-gray-100 !text-gray-700'
                }`}
              >
                <SortAscIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Sort</span>
              </Button>
              <Button
                variant="outline"
                size="baseFull"
                onClick={() => setActiveButton('recent')}
                className={`round-full text-xs sm:text-sm px-3 sm:px-4 ${
                  activeButton === 'recent'
                    ? '!border-blue-600 !text-blue-600 bg-blue-50 font-medium'
                    : '!border-gray-300 bg-gray-100 !text-gray-700'
                }`}
              >
                Recent
              </Button>
            </div>
            <FilterButton
              onFiltersChange={handleFiltersChange}
              buttonClassName="!border-gray-300 bg-gray-100 !text-gray-700 text-xs sm:text-sm px-3 sm:px-4"
              iconSize="w-3 h-3 sm:w-4 sm:h-4"
            />
          </div>
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading approved claims...</p>
            </div>
          )}

          {error && error !== 'Unauthorized' && (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {!isLoading && (!error || error === 'Unauthorized') && displayedClaims.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No approved claims found.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {displayedClaims.map((claim) => (
              <ContentCard key={claim.id} item={claim} />
            ))}
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Button 
              variant="outline" 
              className="px-6 sm:px-8"
              onClick={handleShowMore}
            >
              Show More
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}


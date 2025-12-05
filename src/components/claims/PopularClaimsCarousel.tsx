'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Claim } from '@/lib/types'

interface PopularClaimsCarouselProps {
  className?: string
}

export const PopularClaimsCarousel: React.FC<PopularClaimsCarouselProps> = ({
  className = '',
}) => {
  const [popularClaims, setPopularClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const linkRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchPopularClaims = async () => {
      setIsLoading(true)
      
      // Fetch claims with limit of 3, sorted by upvotes
      const params = new URLSearchParams()
      params.append('status', 'approved')
      params.append('sortBy', 'most-voted')
      params.append('page', '1')
      params.append('limit', '3')

      try {
        const response = await fetch(`/api/claims?${params.toString()}`)
        const data = await response.json()

        if (response.ok && data.claims) {
          setPopularClaims(data.claims.slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching popular claims:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopularClaims()
  }, [])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleMouseEnter = (claimId: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't show tooltip on mobile devices
    if (isMobile) return
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Add a small delay to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      const linkElement = linkRefs.current[claimId]
      if (linkElement) {
        const rect = linkElement.getBoundingClientRect()
        // Responsive tooltip width: smaller on mobile, larger on desktop
        const tooltipWidth = isMobile ? Math.min(280, window.innerWidth - 32) : 384 // w-96 = 24rem = 384px
        const tooltipHeight = 100 // Approximate height
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        
        let left = rect.left
        let top = rect.bottom + 8
        
        // Adjust if tooltip would go off the right edge
        if (left + tooltipWidth > windowWidth) {
          left = windowWidth - tooltipWidth - 16
        }
        
        // Adjust if tooltip would go off the bottom edge
        if (top + tooltipHeight > windowHeight) {
          top = rect.top - tooltipHeight - 8
        }
        
        // Ensure tooltip doesn't go off the left edge
        if (left < 16) {
          left = 16
        }
        
        setTooltipPosition({ top, left })
        setHoveredClaimId(claimId)
      }
    }, 300) // 300ms delay
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHoveredClaimId(null)
    setTooltipPosition(null)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])


  return (
    <div className={className}>
      <h2 className="text-lg sm:text-xl sm:pb-4 font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Popular Claims
      </h2>
      <div className='flex flex-col gap-5 relative'>
        {isLoading ? (
          <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>Loading...</p>
        ) : popularClaims.length === 0 ? (
          <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>No popular claims found.</p>
        ) : (
          <>
            {popularClaims.map((claim) => (
              <div key={claim.id} className="relative">
                <Link
                  ref={(el) => {
                    linkRefs.current[claim.id] = el
                  }}
                  href={`/claims/${claim.id}`}
                  className='text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer block truncate pr-2'
                  onMouseEnter={(e) => handleMouseEnter(claim.id, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {claim.title}
                </Link>
                
                {/* Show description and metadata on mobile below the link */}
                {isMobile && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {claim.description || 'No description available.'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">
                      <span className="truncate pr-2">
                        By: {claim.user?.username || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400">
                          ↑ {claim.upvotes || 0}
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          ↓ {claim.downvotes || 0}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Desktop tooltip */}
                {!isMobile && hoveredClaimId === claim.id && tooltipPosition && (
                  <div
                    className="fixed z-50 w-72 sm:w-80 md:w-96 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                    style={{
                      top: `${tooltipPosition.top}px`,
                      left: `${tooltipPosition.left}px`,
                      maxWidth: 'calc(100vw - 32px)',
                    }}
                    onMouseEnter={() => setHoveredClaimId(claim.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {claim.description || 'No description available.'}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="truncate">
                          By: {claim.user?.username || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400">
                            ↑ {claim.upvotes || 0}
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            ↓ {claim.downvotes || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}


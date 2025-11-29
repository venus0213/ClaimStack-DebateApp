'use client'

import React, { useEffect, useState } from 'react'
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

  return (
    <div className={className}>
      <h2 className="text-lg sm:text-xl sm:pb-4 font-semibold text-gray-900 mb-4">
        Popular Claims
      </h2>
      <div className='flex flex-col gap-4'>
        {isLoading ? (
          <p className='text-gray-600'>Loading...</p>
        ) : popularClaims.length === 0 ? (
          <p className='text-gray-600'>No popular claims found.</p>
        ) : (
          <>
            {popularClaims.map((claim) => (
              <Link
                key={claim.id}
                href={`/claims/${claim.id}`}
                className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer block truncate'
              >
                {claim.title}
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}


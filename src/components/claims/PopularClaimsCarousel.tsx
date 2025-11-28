'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Claim } from '@/lib/types'
import { ContentCard } from '@/components/content/ContentCard'

interface PopularClaimsCarouselProps {
  className?: string
}

export const PopularClaimsCarousel: React.FC<PopularClaimsCarouselProps> = ({
  className = '',
}) => {
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Fetch top 3 popular claims (by upvotes)
  useEffect(() => {
    const fetchPopularClaims = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          '/api/claims?status=approved&sortBy=most-voted&limit=3'
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch popular claims')
        }

        if (data.claims && Array.isArray(data.claims)) {
          // Sort by upvotes descending and take top 3
          const sortedClaims = [...data.claims]
            .filter((claim) => claim.status === 'approved')
            .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
            .slice(0, 3)
          setClaims(sortedClaims)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch popular claims'
        setError(errorMessage)
        console.error('Error fetching popular claims:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopularClaims()
  }, [])

  // Auto-play carousel
  useEffect(() => {
    if (claims.length <= 1 || !isAutoPlaying) {
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % claims.length)
    }, 5000) // Change slide every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [claims.length, isAutoPlaying])

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlaying(true)
  }

  // Manual navigation
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + claims.length) % claims.length)
    setIsAutoPlaying(false)
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % claims.length)
    setIsAutoPlaying(false)
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  if (isLoading) {
    return (
      <div className={`mb-6 sm:mb-8 ${className}`}>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Popular Claims
        </h2>
        <div className="relative w-full h-[400px] sm:h-[450px] bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || claims.length === 0) {
    return null // Don't show anything if there's an error or no claims
  }

  return (
    <div
      className={`mb-6 sm:mb-8 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Popular Claims
      </h2>

      <div className="relative w-full" ref={carouselRef}>
        {/* Carousel Container */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px]">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {claims.map((claim, index) => (
              <div
                key={claim.id}
                className="w-full flex-shrink-0 px-2 sm:px-4"
              >
                <div className="relative">
                  {/* Content Card */}
                  <div className={`transform transition-all duration-500 ${
                    index === currentIndex 
                      ? 'scale-100 opacity-100' 
                      : 'scale-95 opacity-70'
                  }`}>
                    <ContentCard item={claim} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {claims.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
              aria-label="Previous claim"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
              aria-label="Next claim"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Navigation Dots */}
        {claims.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
            {claims.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-blue-500'
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface TopUser {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  totalUpvotes: number
}

export const TopUsers: React.FC = () => {
  const [users, setUsers] = useState<TopUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/users/top?limit=20')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch top users')
        }

        if (data.success && data.users) {
          setUsers(data.users)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch top users'
        setError(errorMessage)
        console.error('Error fetching top users:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Top Users
        </h2>
        <div className="flex gap-3 sm:gap-8 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 sm:w-48 animate-pulse"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || users.length === 0) {
    return null // Don't show anything if there's an error or no users
  }

  return (
    <div className="mb-3 sm:mb-8 sm:mt-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 sm:mb-4">
        Top Users
      </h2>
      <div className="flex gap-3 sm:gap-8 overflow-x-auto scrollbar-hide sm:pb-2 sm:pt-5 pl-2 scroll-smooth">
        {users.map((user, index) => {
          const avatarUrl = user.avatarUrl || '/icons/user.png'
          const displayName =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username

          // Determine border color based on rank
          const getBorderColor = () => {
            if (index === 0) {
              return 'border-yellow-500 dark:border-yellow-400' // Gold
            } else if (index === 1) {
              return 'border-gray-400 dark:border-gray-300' // Silver
            } else if (index === 2) {
              return 'border-orange-600 dark:border-orange-500' // Bronze
            }
            return 'border-blue-500 dark:border-blue-400' // Default blue
          }

          // Determine shadow effect based on rank
          const getShadowEffect = () => {
            if (index === 0) {
              return 'shadow-lg shadow-yellow-500/30 dark:shadow-yellow-400/30 group-hover:shadow-xl group-hover:shadow-yellow-500/40 dark:group-hover:shadow-yellow-400/40' // Gold shadow
            } else if (index === 1) {
              return 'shadow-lg shadow-gray-400/30 dark:shadow-gray-300/30 group-hover:shadow-xl group-hover:shadow-gray-400/40 dark:group-hover:shadow-gray-300/40' // Silver shadow
            } else if (index === 2) {
              return 'shadow-lg shadow-orange-600/30 dark:shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-600/40 dark:group-hover:shadow-orange-500/40' // Bronze shadow
            }
            return 'shadow-lg shadow-blue-500/20 dark:shadow-blue-400/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 dark:group-hover:shadow-blue-400/30' // Default blue shadow
          }

          return (
            <Link
              key={user.id}
              href={currentUser?.id === user.id ? '/profile' : `/users/${user.id}`}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 mt-5">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${getBorderColor()} flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 ${getShadowEffect()} transition-shadow duration-300`}>
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="text-center max-w-[80px] sm:max-w-[120px]">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user.totalUpvotes} {user.totalUpvotes === 1 ? 'upvote' : 'upvotes'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Top Users
        </h2>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-20 sm:w-40 animate-pulse"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
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
    <div className="mb-6 sm:mb-8 sm:mt-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Top Users
      </h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 pt-2 scroll-smooth">
        {users.map((user) => {
          const avatarUrl = user.avatarUrl || '/icons/user.png'
          const displayName =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username

          return (
            <div
              key={user.id}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-500 flex items-center justify-center overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="text-center max-w-[80px] sm:max-w-[100px]">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate w-full group-hover:text-blue-600 transition-colors">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {user.totalUpvotes} {user.totalUpvotes === 1 ? 'upvote' : 'upvotes'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


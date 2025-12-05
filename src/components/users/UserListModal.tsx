'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { User } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'

export interface UserListItem {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  createdAt?: Date
}

export interface UserListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'followers' | 'following'
  title?: string
}

export const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  title,
}) => {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers()
    } else {
      // Reset state when modal closes
      setUsers([])
      setError(null)
    }
  }, [isOpen, userId, type])

  const fetchUsers = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const endpoint = type === 'followers' 
        ? `/api/users/${userId}/followers`
        : `/api/users/${userId}/following`

      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      if (data.success) {
        setUsers(type === 'followers' ? data.followers : data.following)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (user: UserListItem) => {
    // Navigate to user profile
    if (currentUser?.id === user.id) {
      router.push('/profile')
    } else {
      router.push(`/users/${user.id}`)
    }
    onClose()
  }

  const displayTitle = title || (type === 'followers' ? 'Followers' : 'Following')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={displayTitle}
      size="md"
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600 dark:text-red-400 text-center">
              <p className="mb-2">Error: {error}</p>
              <button
                onClick={fetchUsers}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600 dark:text-gray-400 text-center">
              No {type === 'followers' ? 'followers' : 'following'} yet
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => {
              const displayName = user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username
              const avatarUrl = user.avatarUrl || '/icons/user.png'

              return (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}


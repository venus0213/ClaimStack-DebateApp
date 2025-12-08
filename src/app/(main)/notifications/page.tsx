'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { Notification } from '@/lib/types'
import { useNotificationsStore } from '@/store/notificationsStore'
import { Button } from '@/components/ui/Button'
import { 
  ChevronLeftIcon,
  ChatIcon, 
  PaperClipIcon, 
  UserIcon, 
  TrendingUpIcon, 
  ClockIcon, 
  SparklesIcon,
  BellOutlineIcon
} from '@/components/ui/Icons'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function NotificationsPage() {
  const router = useRouter()
  const { requireAuth } = useRequireAuth()
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    requireAuth()
  }, [requireAuth])

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchNotifications()
    }
  }, [])

  useEffect(() => {
    const formatted = notifications.map(notif => ({
      ...notif,
      createdAt: notif.createdAt instanceof Date ? notif.createdAt : new Date(notif.createdAt),
    }))
    setLocalNotifications(formatted)
  }, [notifications])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_comment':
      case 'new_reply':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative">
            <ChatIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="absolute text-[12px] font-bold text-blue-600 dark:text-blue-400 leading-none">i</span>
          </div>
        )
      case 'new_evidence':
      case 'new_perspective':
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <PaperClipIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        )
      case 'new_follower':
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
            <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <span className="absolute text-[12px] font-bold text-gray-600 dark:text-gray-300 leading-none">@</span>
          </div>
        )
      case 'vote_received':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'evidence_rejected':
      case 'perspective_rejected':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        )
      case 'evidence_approved':
      case 'perspective_approved':
      case 'claim_approved':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        )
      case 'claim_submitted':
      case 'new_claim':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BellOutlineIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <BellOutlineIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        )
    }
  }

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {}
    
    notifications.forEach((notification) => {
      let groupKey: string
      const createdAt = notification.createdAt instanceof Date 
        ? notification.createdAt 
        : new Date(notification.createdAt)
      
      if (isToday(createdAt)) {
        groupKey = 'Today'
      } else if (isYesterday(createdAt)) {
        groupKey = 'Yesterday'
      } else {
        groupKey = format(createdAt, 'MMMM d, yyyy')
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })
    
    return groups
  }

  const groupedNotifications = groupNotificationsByDate(localNotifications)
  const dateGroups = Object.keys(groupedNotifications).sort((a, b) => {
    if (a === 'Today') return -1
    if (b === 'Today') return 1
    if (a === 'Yesterday') return -1
    if (b === 'Yesterday') return 1
    return 0
  })

  const unreadCount = localNotifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
              >
                Mark all as read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-12">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p>Loading notifications...</p>
            </div>
          ) : localNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <BellOutlineIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {dateGroups.map((dateGroup, groupIndex) => (
                <div key={dateGroup} className={groupIndex > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""}>
                  <div className="relative px-4 sm:px-6 py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                        {dateGroup}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 px-4 sm:px-6 pb-4">
                    {groupedNotifications[dateGroup].map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        onClick={() => handleNotificationClick(notification)}
                        className={`block p-4 sm:p-5 rounded-xl transition-colors ${
                          notification.read
                            ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 relative">
                            {getNotificationIcon(notification.type)}
                            {!notification.read && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                                  {notification.title}
                                </p>
                                {notification.message && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                                    {notification.message}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {(() => {
                                    const createdAt = notification.createdAt instanceof Date 
                                      ? notification.createdAt 
                                      : new Date(notification.createdAt)
                                    return formatDistanceToNow(createdAt, { addSuffix: true })
                                  })()}
                                </span>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {format(
                                    notification.createdAt instanceof Date 
                                      ? notification.createdAt 
                                      : new Date(notification.createdAt),
                                    'MMM d, h:mm a'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { Notification } from '@/lib/types'
import { useNotificationsStore } from '@/store/notificationsStore'
import { Button } from '@/components/ui/Button'
import { 
  XIcon, 
  ChatIcon, 
  PaperClipIcon, 
  UserIcon, 
  TrendingUpIcon, 
  ClockIcon, 
  SparklesIcon,
  BellOutlineIcon
} from '@/components/ui/Icons'

interface NotificationListProps {
  onClose: () => void
}

export const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotificationsStore()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const router = useRouter()

  useEffect(() => {
    if (notifications.length === 0) {
      fetchNotifications(6)
    }
  }, [])

  useEffect(() => {
    const limited = notifications.slice(0, 6).map(notif => ({
      ...notif,
      createdAt: notif.createdAt instanceof Date ? notif.createdAt : new Date(notif.createdAt),
    }))
    setLocalNotifications(limited)
  }, [notifications])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_comment':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative">
            <ChatIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="absolute text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-none">i</span>
          </div>
        )
      case 'new_evidence':
      case 'new_perspective':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <PaperClipIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        )
      case 'new_follower':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
            <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute text-[10px] font-bold text-gray-600 dark:text-gray-300 leading-none">@</span>
          </div>
        )
      case 'vote_received':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <TrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'evidence_rejected':
      case 'perspective_rejected':
      case 'claim_rejected':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
        )
      case 'evidence_approved':
      case 'perspective_approved':
      case 'claim_approved':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        )
      case 'claim_submitted':
      case 'new_claim':
      case 'expedited_review_requested':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BellOutlineIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <BellOutlineIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        )
    }
  }

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

  return (
    <div className="flex flex-col">
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>Loading notifications...</p>
          </div>
        ) : localNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No notifications</p>
          </div>
        ) : (
          <div>
            {dateGroups.map((dateGroup, groupIndex) => (
              <div key={dateGroup} className={groupIndex > 0 ? "mt-4" : ""}>
                <div className="relative px-4 py-3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[324px] border-t border-gray-300 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{dateGroup}</span>
                  </div>
                </div>
                <div className="space-y-2 px-4 pb-4">
                  {groupedNotifications[dateGroup].map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.link || '#'}
                      onClick={() => {
                        handleNotificationClick(notification)
                        onClose()
                      }}
                      className={`block p-4 rounded-2xl transition-colors ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 relative">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {(() => {
                                const createdAt = notification.createdAt instanceof Date 
                                  ? notification.createdAt 
                                  : new Date(notification.createdAt)
                                return formatDistanceToNow(createdAt, { addSuffix: true })
                              })()}
                            </span>
                          </div>
                          {notification.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                          )}
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

      {!isLoading && localNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button
            onClick={() => {
              onClose()
              router.push('/notifications')
            }}
            variant="outline"
            className="w-full"
          >
            Show all
          </Button>
        </div>
      )}
    </div>
  )
}


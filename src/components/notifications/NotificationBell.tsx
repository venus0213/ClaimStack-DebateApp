'use client'

import React, { useState, useEffect } from 'react'
import { NotificationList } from './NotificationList'
import { useNotificationsStore } from '@/store/notificationsStore'

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, fetchNotifications } = useNotificationsStore()

  useEffect(() => {
    fetchNotifications(6)
    
    const interval = setInterval(() => {
      fetchNotifications(6)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-[-60px] top-1/2 sm:top-auto -translate-y-1/2 sm:translate-y-0 sm:mt-2 w-[calc(100%-2rem)] sm:w-96 max-h-[90vh] sm:max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-y-auto transition-colors">
            <NotificationList onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}


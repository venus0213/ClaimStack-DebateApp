'use client'

import { create } from 'zustand'
import { Notification } from '@/lib/types'

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
  fetchingPromise: Promise<void> | null

  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => Promise<void>
  setNotifications: (notifications: Notification[]) => void
  fetchNotifications: (limit?: number, force?: boolean) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetchTime: null,
  fetchingPromise: null,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  markAsRead: async (notificationId: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      }
    })

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  },

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  fetchNotifications: async (limit?: number, force: boolean = false) => {
    const state = get()
    const now = Date.now()
    
    if (state.fetchingPromise && !force) {
      return state.fetchingPromise
    }

    if (!force && state.lastFetchTime && (now - state.lastFetchTime) < 2000) {
      return Promise.resolve()
    }

    const fetchPromise = (async () => {
      try {
        set({ isLoading: true, error: null, lastFetchTime: now })

        const url = limit ? `/api/notifications?limit=${limit}` : '/api/notifications'
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch notifications')
        }

        set({
          notifications: data.notifications,
          unreadCount: data.notifications.filter((n: Notification) => !n.read).length,
          isLoading: false,
          fetchingPromise: null,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications'
        set({ 
          error: errorMessage, 
          isLoading: false,
          fetchingPromise: null,
        })
      }
    })()

    set({ fetchingPromise: fetchPromise })
    return fetchPromise
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}))


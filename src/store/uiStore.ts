'use client'

import { create } from 'zustand'

interface UIState {
  // Modals
  modals: {
    login: boolean
    signup: boolean
    loginRequired: boolean
    claimForm: boolean
    evidenceForm: boolean
    perspectiveForm: boolean
    [key: string]: boolean
  }

  // Toast notifications
  toasts: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    duration?: number
  }>

  // Sidebar
  sidebarOpen: boolean

  // Theme (for future use)
  theme: 'light' | 'dark'

  // Actions
  openModal: (modalName: string) => void
  closeModal: (modalName: string) => void
  closeAllModals: () => void
  addToast: (message: string, type?: UIState['toasts'][0]['type'], duration?: number) => void
  removeToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set, get) => ({
  modals: {
    login: false,
    signup: false,
    loginRequired: false,
    claimForm: false,
    evidenceForm: false,
    perspectiveForm: false,
  },
  toasts: [],
  sidebarOpen: false,
  theme: 'light',

  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  closeAllModals: () =>
    set((state) => {
      const closedModals: Partial<UIState['modals']> = {}
      Object.keys(state.modals).forEach((key) => {
        closedModals[key] = false
      })
      return { modals: closedModals as UIState['modals'] }
    }),

  addToast: (message, type = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => set({ theme }),
}))


'use client'

import { create } from 'zustand'
import { Claim } from '@/lib/types'

interface ClaimsState {
  claims: Claim[]
  currentClaim: Claim | null
  isLoading: boolean
  error: string | null
  filters: {
    category?: string
    status?: string
    search?: string
    sortBy?: 'newest' | 'popular' | 'trending'
  }
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }

  // Actions
  setClaims: (claims: Claim[]) => void
  addClaim: (claim: Claim) => void
  updateClaim: (id: string, updates: Partial<Claim>) => void
  removeClaim: (id: string) => void
  setCurrentClaim: (claim: Claim | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<ClaimsState['filters']>) => void
  setPagination: (pagination: Partial<ClaimsState['pagination']>) => void
  resetFilters: () => void
  fetchClaims: (options?: { refresh?: boolean }) => Promise<void>
  fetchPendingClaims: (options?: { refresh?: boolean }) => Promise<void>
  fetchApprovedClaims: (options?: { refresh?: boolean }) => Promise<void>
  fetchRejectedClaims: (options?: { refresh?: boolean }) => Promise<void>
  fetchClaim: (id: string) => Promise<void>
  approveClaim: (id: string) => Promise<{ success: boolean; error?: string }>
  rejectClaim: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  createClaim: (data: {
    title: string
    description?: string
    category?: string
    evidenceType?: 'url' | 'youtube' | 'tweet' | 'file'
    evidenceUrl?: string
    evidenceDescription?: string
    position?: 'for' | 'against'
    file?: File
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
  }) => Promise<{ success: boolean; claim?: Claim; error?: string }>
}

const initialFilters = {
  category: undefined,
  status: undefined,
  search: undefined,
  sortBy: 'newest' as const,
}

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: [],
  currentClaim: null,
  isLoading: false,
  error: null,
  filters: initialFilters,
  pagination: initialPagination,

  setClaims: (claims) => set({ claims }),

  addClaim: (claim) =>
    set((state) => ({
      claims: [claim, ...state.claims],
    })),

  updateClaim: (id, updates) =>
    set((state) => {
      const updatedClaims = state.claims.map((claim) =>
        claim.id === id ? { ...claim, ...updates } : claim
      )
      const updatedCurrentClaim =
        state.currentClaim?.id === id
          ? { ...state.currentClaim, ...updates }
          : state.currentClaim
      
      return {
        claims: updatedClaims,
        currentClaim: updatedCurrentClaim,
      }
    }),

  removeClaim: (id) =>
    set((state) => ({
      claims: state.claims.filter((claim) => claim.id !== id),
      currentClaim:
        state.currentClaim?.id === id ? null : state.currentClaim,
    })),

  setCurrentClaim: (claim) => set({ currentClaim: claim }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...initialPagination, page: 1 },
    })),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  resetFilters: () =>
    set({
      filters: initialFilters,
      pagination: initialPagination,
    }),

  fetchClaims: async (options = {}) => {
    const { refresh = false } = options
    const state = get()

    if (state.isLoading && !refresh) return

    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      if (state.filters.category) params.append('category', state.filters.category)
      if (state.filters.status) params.append('status', state.filters.status)
      if (state.filters.search) params.append('search', state.filters.search)
      if (state.filters.sortBy) params.append('sortBy', state.filters.sortBy)
      params.append('page', state.pagination.page.toString())
      params.append('limit', state.pagination.limit.toString())

      const response = await fetch(`/api/claims?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch claims')
      }

      set({
        claims: refresh ? data.claims : [...state.claims, ...data.claims],
        pagination: {
          ...state.pagination,
          total: data.total,
          hasMore: data.hasMore,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claims'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchPendingClaims: async (options = {}) => {
    const { refresh = false } = options
    const state = get()

    if (state.isLoading && !refresh) return

    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      params.append('status', 'pending')
      params.append('page', state.pagination.page.toString())
      params.append('limit', state.pagination.limit.toString())
      params.append('sortBy', 'newest')

      const response = await fetch(`/api/claims?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending claims')
      }

      set({
        claims: refresh ? data.claims : [...state.claims, ...data.claims],
        pagination: {
          ...state.pagination,
          total: data.total,
          hasMore: data.hasMore,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending claims'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchApprovedClaims: async (options = {}) => {
    const { refresh = false } = options
    const state = get()

    if (state.isLoading && !refresh) return

    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      params.append('status', 'approved')
      params.append('page', state.pagination.page.toString())
      params.append('limit', state.pagination.limit.toString())
      params.append('sortBy', 'newest')

      const response = await fetch(`/api/claims?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch approved claims')
      }

      set({
        claims: refresh ? data.claims : [...state.claims, ...data.claims],
        pagination: {
          ...state.pagination,
          total: data.total,
          hasMore: data.hasMore,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch approved claims'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchRejectedClaims: async (options = {}) => {
    const { refresh = false } = options
    const state = get()

    if (state.isLoading && !refresh) return

    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      params.append('status', 'rejected')
      params.append('page', state.pagination.page.toString())
      params.append('limit', state.pagination.limit.toString())
      params.append('sortBy', 'newest')

      const response = await fetch(`/api/claims?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rejected claims')
      }

      set({
        claims: refresh ? data.claims : [...state.claims, ...data.claims],
        pagination: {
          ...state.pagination,
          total: data.total,
          hasMore: data.hasMore,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rejected claims'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchClaim: async (id: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch(`/api/claims/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch claim')
      }

      set({
        currentClaim: data.claim,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claim'
      set({ error: errorMessage, isLoading: false })
    }
  },

  approveClaim: async (id: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch(`/api/claims/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve claim')
      }

      // Update claim in store
      if (data.claim) {
        get().updateClaim(id, { status: 'approved' })
      }

      set({ isLoading: false, error: null })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve claim'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  rejectClaim: async (id: string, reason?: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch(`/api/claims/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject claim')
      }

      // Update claim in store
      if (data.claim) {
        get().updateClaim(id, { status: 'rejected' })
      }

      set({ isLoading: false, error: null })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject claim'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  createClaim: async (data) => {
    try {
      set({ isLoading: true, error: null })

      // If file is provided, upload it first
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined
      let fileType: string | undefined

      // Upload file if provided
      if (data.file) {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('folder', 'claims')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        // Check if response is JSON
        const uploadContentType = uploadResponse.headers.get('content-type')
        if (!uploadContentType || !uploadContentType.includes('application/json')) {
          const text = await uploadResponse.text()
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload file')
        }

        fileUrl = uploadData.data.fileUrl
        fileName = uploadData.data.fileName
        fileSize = uploadData.data.fileSize
        fileType = uploadData.data.fileType
      }

      // Prepare request body
      const requestBody: any = {
        title: data.title,
        description: data.description,
        category: data.category,
      }

      // Add file information directly to claim if file is uploaded
      if (fileUrl) {
        requestBody.fileUrl = fileUrl
        requestBody.fileName = fileName
        requestBody.fileSize = fileSize
        requestBody.fileType = fileType
      }

      // Add URL directly to claim if URL is provided
      if (data.evidenceUrl && data.evidenceType && data.evidenceType !== 'file') {
        requestBody.url = data.evidenceUrl
      }

      // Add evidence data if provided (this creates separate evidence record)
      if (data.evidenceType) {
        requestBody.evidenceType = data.evidenceType
        requestBody.evidenceDescription = data.evidenceDescription
        requestBody.position = data.position

        // Add type-specific fields for evidence
        if (data.evidenceType === 'file') {
          requestBody.fileUrl = fileUrl || data.fileUrl
          requestBody.fileName = fileName || data.fileName
          requestBody.fileSize = fileSize || data.fileSize
          requestBody.fileType = fileType || data.fileType
        } else if (data.evidenceType === 'url' || data.evidenceType === 'youtube' || data.evidenceType === 'tweet') {
          requestBody.evidenceUrl = data.evidenceUrl
        }
      }

      // Create claim
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create claim')
      }

      if (result.claim && result.claim.status === 'approved') {
        get().addClaim(result.claim)
      }

      set({ isLoading: false, error: null })
      return { success: true, claim: result.claim }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create claim'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },
}))


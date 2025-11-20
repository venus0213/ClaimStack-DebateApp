'use client'

import { create } from 'zustand'
import { Evidence, Perspective } from '@/lib/types'

interface EvidenceState {
  evidence: Evidence[]
  perspectives: Perspective[]
  isLoading: boolean
  error: string | null
  filters: {
    claimId?: string
    position?: 'for' | 'against'
    type?: 'evidence' | 'perspective' | 'all'
  }

  // Actions
  setEvidence: (evidence: Evidence[]) => void
  addEvidence: (evidence: Evidence) => void
  updateEvidence: (id: string, updates: Partial<Evidence>) => void
  removeEvidence: (id: string) => void
  setPerspectives: (perspectives: Perspective[]) => void
  addPerspective: (perspective: Perspective) => void
  updatePerspective: (id: string, updates: Partial<Perspective>) => void
  removePerspective: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<EvidenceState['filters']>) => void
  fetchEvidence: (claimId: string, position?: 'for' | 'against') => Promise<void>
  fetchPerspectives: (claimId: string, position?: 'for' | 'against') => Promise<void>
  getCombinedFeed: (claimId: string, position: 'for' | 'against') => Array<Evidence | Perspective>
  createEvidence: (claimId: string, data: {
    type: 'url' | 'file'
    url?: string
    file?: File
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    title?: string
    description?: string
    position: 'for' | 'against'
  }) => Promise<{ success: boolean; evidence?: Evidence; error?: string }>
  createPerspective: (claimId: string, data: {
    type?: 'url' | 'file'
    url?: string
    file?: File
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    title?: string
    body: string
    position: 'for' | 'against'
  }) => Promise<{ success: boolean; perspective?: Perspective; error?: string }>
}

export const useEvidenceStore = create<EvidenceState>((set, get) => ({
  evidence: [],
  perspectives: [],
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
  },

  setEvidence: (evidence) => set({ evidence }),

  addEvidence: (evidence) =>
    set((state) => ({
      evidence: [evidence, ...state.evidence],
    })),

  updateEvidence: (id, updates) =>
    set((state) => ({
      evidence: state.evidence.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeEvidence: (id) =>
    set((state) => ({
      evidence: state.evidence.filter((item) => item.id !== id),
    })),

  setPerspectives: (perspectives) => set({ perspectives }),

  addPerspective: (perspective) =>
    set((state) => ({
      perspectives: [perspective, ...state.perspectives],
    })),

  updatePerspective: (id, updates) =>
    set((state) => ({
      perspectives: state.perspectives.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removePerspective: (id) =>
    set((state) => ({
      perspectives: state.perspectives.filter((item) => item.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  fetchEvidence: async (claimId: string, position?: 'for' | 'against') => {
    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      params.append('claimId', claimId)
      if (position) params.append('position', position)

      const response = await fetch(`/api/evidence?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch evidence')
      }

      set({
        evidence: data.evidence,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evidence'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchPerspectives: async (claimId: string, position?: 'for' | 'against') => {
    try {
      set({ isLoading: true, error: null })

      const params = new URLSearchParams()
      params.append('claimId', claimId)
      if (position) params.append('position', position)

      const response = await fetch(`/api/perspectives?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch perspectives')
      }

      set({
        perspectives: data.perspectives,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch perspectives'
      set({ error: errorMessage, isLoading: false })
    }
  },

  getCombinedFeed: (claimId: string, position: 'for' | 'against') => {
    const state = get()
    const evidence = state.evidence.filter(
      (e) => e.claimId === claimId && e.position === position
    )
    const perspectives = state.perspectives.filter(
      (p) => p.claimId === claimId && p.position === position
    )

    // Combine and sort by score (Evidence first on ties)
    const combined = [
      ...evidence.map((e) => ({ ...e, _type: 'evidence' as const })),
      ...perspectives.map((p) => ({ ...p, _type: 'perspective' as const })),
    ].sort((a, b) => {
      // Primary sort: score (descending)
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Tie-break: Evidence before Perspectives
      if (a._type === 'evidence' && b._type === 'perspective') return -1
      if (a._type === 'perspective' && b._type === 'evidence') return 1
      return 0
    })

    return combined as Array<Evidence | Perspective>
  },

  createEvidence: async (claimId, data) => {
    try {
      set({ isLoading: true, error: null })

      // If file is provided, upload it first
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined
      let fileType: string | undefined

      if (data.type === 'file') {
        if (data.file) {
          // Upload file
          const formData = new FormData()
          formData.append('file', data.file)
          formData.append('folder', 'evidence')

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
        } else if (data.fileUrl) {
          // File URL already provided (uploaded separately)
          fileUrl = data.fileUrl
          fileName = data.fileName
          fileSize = data.fileSize
          fileType = data.fileType
        }
      }

      // Prepare request body based on type
      const requestBody: any = {
        type: data.type,
        title: data.title,
        description: data.description,
        position: data.position,
      }

      // Add type-specific fields
      if (data.type === 'url') {
        requestBody.url = data.url
      } else if (data.type === 'file') {
        requestBody.fileUrl = fileUrl || data.fileUrl
        requestBody.fileName = fileName || data.fileName
        requestBody.fileSize = fileSize || data.fileSize
        requestBody.fileType = fileType || data.fileType
      }

      // Create evidence
      const response = await fetch(`/api/claims/evidence?id=${claimId}`, {
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
        throw new Error(result.error || 'Failed to create evidence')
      }

      // Add evidence to store
      if (result.evidence) {
        get().addEvidence(result.evidence)
      }

      // Update claim score if provided in response
      // Note: We'll update this in the component to avoid circular dependency
      // The API response includes the updated claim score

      set({ isLoading: false, error: null })
      return { 
        success: true, 
        evidence: result.evidence,
        claim: result.claim, // Include claim with updated score
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create evidence'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  createPerspective: async (claimId, data) => {
    try {
      set({ isLoading: true, error: null })

      // If file is provided, upload it first
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined
      let fileType: string | undefined

      if (data.type === 'file' && data.file) {
        // Upload file
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('folder', 'perspectives')

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
      } else if (data.fileUrl) {
        // File URL already provided (uploaded separately)
        fileUrl = data.fileUrl
        fileName = data.fileName
        fileSize = data.fileSize
        fileType = data.fileType
      }

      // Prepare request body
      const requestBody: any = {
        body: data.body,
        title: data.title?.trim() || undefined,
        position: data.position,
      }

      // Add type-specific fields
      if (data.type === 'url' && data.url) {
        requestBody.type = 'url'
        requestBody.url = data.url
      } else if (data.type === 'file' && (fileUrl || data.fileUrl)) {
        requestBody.type = 'file'
        requestBody.fileUrl = fileUrl || data.fileUrl
        requestBody.fileName = fileName || data.fileName
        requestBody.fileSize = fileSize || data.fileSize
        requestBody.fileType = fileType || data.fileType
      }

      // Create perspective
      const response = await fetch(`/api/claims/perspectives?id=${claimId}`, {
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
        throw new Error(result.error || 'Failed to create perspective')
      }

      // Add perspective to store
      if (result.perspective) {
        get().addPerspective(result.perspective)
      }

      // Update claim score if provided in response
      // Note: We'll update this in the component to avoid circular dependency
      // The API response includes the updated claim score

      set({ isLoading: false, error: null })
      return { 
        success: true, 
        perspective: result.perspective,
        claim: result.claim, // Include claim with updated score
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create perspective'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },
}))


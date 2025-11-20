'use client'

import { useState, useCallback } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useClaimsStore } from '@/store/claimsStore'
import { useEvidenceStore } from '@/store/evidenceStore'

type FollowableItem = 'claim' | 'evidence' | 'perspective'

interface UseFollowOptions {
  itemId: string
  itemType: FollowableItem
  currentIsFollowing?: boolean
  currentFollowCount?: number
}

interface UseFollowReturn {
  isFollowing: boolean
  followCount: number
  isFollowingAction: boolean
  toggleFollow: () => Promise<void>
}

export function useFollow({
  itemId,
  itemType,
  currentIsFollowing = false,
  currentFollowCount = 0,
}: UseFollowOptions): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(currentIsFollowing)
  const [followCount, setFollowCount] = useState(currentFollowCount)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const { requireAuth } = useRequireAuth()

  const { updateClaim } = useClaimsStore()
  const { updateEvidence, updatePerspective } = useEvidenceStore()

  // Determine API endpoint
  const getEndpoint = useCallback(() => {
    switch (itemType) {
      case 'claim':
        return `/api/claims/${itemId}/follow`
      case 'evidence':
        return `/api/evidence/${itemId}/follow`
      case 'perspective':
        return `/api/perspectives/${itemId}/follow`
      default:
        throw new Error(`Invalid item type: ${itemType}`)
    }
  }, [itemId, itemType])

  const toggleFollow = useCallback(async () => {
    if (isFollowingAction) return

    await requireAuth(async () => {
      setIsFollowingAction(true)

      // Optimistic update
      const previousFollowing = isFollowing
      const previousFollowCount = followCount
      const newFollowing = !previousFollowing
      const newFollowCount = newFollowing ? followCount + 1 : Math.max(0, followCount - 1)

      setIsFollowing(newFollowing)
      setFollowCount(newFollowCount)

      try {
        const response = await fetch(getEndpoint(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to follow')
        }

        const data = await response.json()

        // Update global state based on item type
        if (itemType === 'claim') {
          if (data.success && data.claim) {
            updateClaim(itemId, {
              followCount: data.claim.followCount,
            })
            setIsFollowing(data.isFollowing)
            setFollowCount(data.claim.followCount)
          }
        } else if (itemType === 'evidence') {
          if (data.success && data.evidence) {
            updateEvidence(itemId, {
              isFollowing: data.isFollowing,
              followCount: data.evidence.followCount,
            })
            setIsFollowing(data.isFollowing)
            setFollowCount(data.evidence.followCount)
          }
        } else if (itemType === 'perspective') {
          if (data.success && data.perspective) {
            updatePerspective(itemId, {
              isFollowing: data.isFollowing,
              followCount: data.perspective.followCount,
            })
            setIsFollowing(data.isFollowing)
            setFollowCount(data.perspective.followCount)
          }
        }
      } catch (error) {
        // Revert optimistic update on error
        setIsFollowing(previousFollowing)
        setFollowCount(previousFollowCount)
        console.error('Error following:', error)
        throw error
      } finally {
        setIsFollowingAction(false)
      }
    })
  }, [
    itemId,
    itemType,
    isFollowing,
    followCount,
    isFollowingAction,
    getEndpoint,
    requireAuth,
    updateClaim,
    updateEvidence,
    updatePerspective,
  ])

  return {
    isFollowing,
    followCount,
    isFollowingAction,
    toggleFollow,
  }
}


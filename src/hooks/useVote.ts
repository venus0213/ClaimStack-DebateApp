'use client'

import { useState, useCallback } from 'react'
import { useClaimsStore } from '@/store/claimsStore'
import { useEvidenceStore } from '@/store/evidenceStore'

type VoteableItem = 'claim' | 'evidence' | 'perspective'

interface UseVoteOptions {
  itemId: string
  itemType: VoteableItem
  currentUpvotes?: number
  currentDownvotes?: number
  currentUserVote?: 'upvote' | 'downvote' | null
  claimId?: string
}

interface UseVoteReturn {
  upvotes: number
  downvotes: number
  userVote: 'upvote' | 'downvote' | null
  isVoting: boolean
  vote: (voteType: 'upvote' | 'downvote') => Promise<void>
}

export function useVote({
  itemId,
  itemType,
  currentUpvotes = 0,
  currentDownvotes = 0,
  currentUserVote = null,
  claimId,
}: UseVoteOptions): UseVoteReturn {
  const [upvotes, setUpvotes] = useState(currentUpvotes)
  const [downvotes, setDownvotes] = useState(currentDownvotes)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(currentUserVote)
  const [isVoting, setIsVoting] = useState(false)

  const { updateClaim } = useClaimsStore()
  const { updateEvidence, updatePerspective } = useEvidenceStore()

  const getEndpoint = useCallback(() => {
    switch (itemType) {
      case 'claim':
        return `/api/claims/${itemId}/vote`
      case 'evidence':
        return `/api/evidence/${itemId}/vote`
      case 'perspective':
        return `/api/perspectives/${itemId}/vote`
      default:
        throw new Error(`Invalid item type: ${itemType}`)
    }
  }, [itemId, itemType])

  const vote = useCallback(
    async (voteType: 'upvote' | 'downvote') => {
      if (isVoting) return

      setIsVoting(true)

      const previousVote = userVote
      let newUpvotes = upvotes
      let newDownvotes = downvotes
      let newUserVote: 'upvote' | 'downvote' | null = voteType

      if (previousVote === voteType) {
        newUserVote = null
        if (voteType === 'upvote') {
          newUpvotes = Math.max(0, upvotes - 1)
        } else {
          newDownvotes = Math.max(0, downvotes - 1)
        }
      } else if (previousVote) {
        if (previousVote === 'upvote') {
          newUpvotes = Math.max(0, upvotes - 1)
        } else {
          newDownvotes = Math.max(0, downvotes - 1)
        }
        if (voteType === 'upvote') {
          newUpvotes += 1
        } else {
          newDownvotes += 1
        }
      } else {
        if (voteType === 'upvote') {
          newUpvotes += 1
        } else {
          newDownvotes += 1
        }
      }

      setUpvotes(newUpvotes)
      setDownvotes(newDownvotes)
      setUserVote(newUserVote)

      try {
        const response = await fetch(getEndpoint(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ voteType }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to vote')
        }

        const data = await response.json()

        if (itemType === 'claim') {
          if (data.success && data.claim) {
            updateClaim(itemId, {
              upvotes: data.claim.upvotes,
              downvotes: data.claim.downvotes,
              totalScore: data.claim.totalScore,
              userVote: data.userVote,
            })
            setUpvotes(data.claim.upvotes)
            setDownvotes(data.claim.downvotes)
            setUserVote(data.userVote)
          }
        } else if (itemType === 'evidence') {
          if (data.success && data.evidence) {
            updateEvidence(itemId, {
              upvotes: data.evidence.upvotes,
              downvotes: data.evidence.downvotes,
              score: data.evidence.score,
              userVote: data.userVote,
            })
            setUpvotes(data.evidence.upvotes)
            setDownvotes(data.evidence.downvotes)
            setUserVote(data.userVote)

            if (claimId && data.claim) {
              updateClaim(claimId, {
                totalScore: data.claim.totalScore,
              })
            } else if (claimId) {
              const claimResponse = await fetch(`/api/claims/${claimId}`, {
                credentials: 'include',
              })
              if (claimResponse.ok) {
                const claimData = await claimResponse.json()
                if (claimData.success && claimData.claim) {
                  updateClaim(claimId, {
                    totalScore: claimData.claim.totalScore,
                  })
                }
              }
            }
          }
        } else if (itemType === 'perspective') {
          if (data.success && data.perspective) {
            updatePerspective(itemId, {
              upvotes: data.perspective.upvotes,
              downvotes: data.perspective.downvotes,
              score: data.perspective.score,
              userVote: data.userVote,
            })
            setUpvotes(data.perspective.upvotes)
            setDownvotes(data.perspective.downvotes)
            setUserVote(data.userVote)

            if (claimId && data.claim) {
              updateClaim(claimId, {
                totalScore: data.claim.totalScore,
              })
            } else if (claimId) {
              const claimResponse = await fetch(`/api/claims/${claimId}`, {
                credentials: 'include',
              })
              if (claimResponse.ok) {
                const claimData = await claimResponse.json()
                if (claimData.success && claimData.claim) {
                  updateClaim(claimId, {
                    totalScore: claimData.claim.totalScore,
                  })
                }
              }
            }
          }
        }
      } catch (error) {
        setUpvotes(upvotes)
        setDownvotes(downvotes)
        setUserVote(previousVote)
        console.error('Error voting:', error)
        throw error
      } finally {
        setIsVoting(false)
      }
    },
    [
      itemId,
      itemType,
      claimId,
      upvotes,
      downvotes,
      userVote,
      isVoting,
      getEndpoint,
      updateClaim,
      updateEvidence,
      updatePerspective,
    ]
  )

  return {
    upvotes,
    downvotes,
    userVote,
    isVoting,
    vote,
  }
}


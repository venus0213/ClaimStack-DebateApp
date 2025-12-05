import mongoose from 'mongoose'
import { Evidence, Position, EvidenceStatus } from '@/lib/db/models'
import { Perspective, PerspectiveStatus } from '@/lib/db/models'
import { Claim, Category } from '@/lib/db/models'
import { generateSEOMetadata } from '@/lib/ai/summarize'

const EVIDENCE_FOR_SCORE = 1
const EVIDENCE_AGAINST_SCORE = -1
const PERSPECTIVE_FOR_SCORE = 0.5
const PERSPECTIVE_AGAINST_SCORE = -0.5
const VOTE_THRESHOLD_FOR_DOUBLE_WEIGHT = 10

export function getVoteWeightMultiplier(upvotes: number, downvotes: number): number {
  const totalVotes = upvotes + downvotes
  return totalVotes > VOTE_THRESHOLD_FOR_DOUBLE_WEIGHT ? 2 : 1
}

export function calculateEvidenceContribution(
  position: Position,
  upvotes: number,
  downvotes: number
): number {
  const baseScore = position === Position.FOR ? EVIDENCE_FOR_SCORE : EVIDENCE_AGAINST_SCORE
  const weightMultiplier = getVoteWeightMultiplier(upvotes, downvotes)
  return baseScore * weightMultiplier
}

export function calculatePerspectiveContribution(
  position: Position,
  upvotes: number,
  downvotes: number
): number {
  const baseScore = position === Position.FOR ? PERSPECTIVE_FOR_SCORE : PERSPECTIVE_AGAINST_SCORE
  const weightMultiplier = getVoteWeightMultiplier(upvotes, downvotes)
  return baseScore * weightMultiplier
}

export async function calculateClaimScore(claimId: mongoose.Types.ObjectId): Promise<number> {
  const evidence = await Evidence.find({
    claimId,
    status: EvidenceStatus.APPROVED,
  })

  const perspectives = await Perspective.find({
    claimId,
    status: PerspectiveStatus.APPROVED,
  })

  let totalScore = 0

  for (const ev of evidence) {
    const contribution = calculateEvidenceContribution(
      ev.position,
      ev.upvotes,
      ev.downvotes
    )
    totalScore += contribution
  }

  for (const persp of perspectives) {
    const contribution = calculatePerspectiveContribution(
      persp.position,
      persp.upvotes,
      persp.downvotes
    )
    totalScore += contribution
  }

  return totalScore
}

export async function updateClaimScore(claimId: mongoose.Types.ObjectId): Promise<number> {
  const totalScore = await calculateClaimScore(claimId)
  
  // Get the claim with category populated to update SEO metadata
  const claim = await Claim.findById(claimId).populate('categoryId', 'name slug')
  
  if (!claim) {
    throw new Error(`Claim with ID ${claimId} not found`)
  }
  
  // Update total score
  claim.totalScore = totalScore
  await claim.save()
  
  // Determine leading side based on totalScore
  const leadingSide: 'for' | 'against' | null = totalScore > 0 
    ? 'for' 
    : totalScore < 0 
    ? 'against' 
    : null
  
  // Update SEO metadata if leading side changed or if SEO metadata doesn't exist
  // (async, non-blocking)
  const categoryName = claim.categoryId && !(claim.categoryId instanceof mongoose.Types.ObjectId)
    ? (claim.categoryId as any).name
    : undefined
  
  generateSEOMetadata({
    claimTitle: claim.title,
    claimCategory: categoryName,
    leadingSide,
  })
    .then(async (seoMetadata) => {
      try {
        await Claim.findByIdAndUpdate(claimId, {
          seoTitle: seoMetadata.seoTitle,
          seoDescription: seoMetadata.seoDescription,
        })
      } catch (dbError) {
        console.error('Error updating SEO metadata after score change:', dbError)
      }
    })
    .catch((error) => {
      console.warn('SEO metadata update after score change completed with fallback or error:', error?.message || 'Unknown error')
    })
  
  return totalScore
}


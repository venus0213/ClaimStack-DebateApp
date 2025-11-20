import mongoose from 'mongoose'
import { Evidence, Position, EvidenceStatus } from '@/lib/db/models'
import { Perspective, PerspectiveStatus } from '@/lib/db/models'
import { Claim } from '@/lib/db/models'

/**
 * Constants for score calculation
 */
const EVIDENCE_FOR_SCORE = 1
const EVIDENCE_AGAINST_SCORE = -1
const PERSPECTIVE_FOR_SCORE = 0.5
const PERSPECTIVE_AGAINST_SCORE = -0.5
const VOTE_THRESHOLD_FOR_DOUBLE_WEIGHT = 10

/**
 * Calculate the weight multiplier based on vote count
 * If total votes (upvotes + downvotes) > 10, the weight is doubled
 * 
 * @param upvotes - Number of upvotes
 * @param downvotes - Number of downvotes
 * @returns Weight multiplier (1 or 2)
 */
export function getVoteWeightMultiplier(upvotes: number, downvotes: number): number {
  const totalVotes = upvotes + downvotes
  return totalVotes > VOTE_THRESHOLD_FOR_DOUBLE_WEIGHT ? 2 : 1
}

/**
 * Calculate the contribution of a single evidence item to the claim score
 * 
 * @param position - Position of the evidence ('for' or 'against')
 * @param upvotes - Number of upvotes on the evidence
 * @param downvotes - Number of downvotes on the evidence
 * @returns Contribution score to the claim
 */
export function calculateEvidenceContribution(
  position: Position,
  upvotes: number,
  downvotes: number
): number {
  const baseScore = position === Position.FOR ? EVIDENCE_FOR_SCORE : EVIDENCE_AGAINST_SCORE
  const weightMultiplier = getVoteWeightMultiplier(upvotes, downvotes)
  return baseScore * weightMultiplier
}

/**
 * Calculate the contribution of a single perspective item to the claim score
 * 
 * @param position - Position of the perspective ('for' or 'against')
 * @param upvotes - Number of upvotes on the perspective
 * @param downvotes - Number of downvotes on the perspective
 * @returns Contribution score to the claim
 */
export function calculatePerspectiveContribution(
  position: Position,
  upvotes: number,
  downvotes: number
): number {
  const baseScore = position === Position.FOR ? PERSPECTIVE_FOR_SCORE : PERSPECTIVE_AGAINST_SCORE
  const weightMultiplier = getVoteWeightMultiplier(upvotes, downvotes)
  return baseScore * weightMultiplier
}

/**
 * Calculate total score for a claim based on evidence and perspectives
 * 
 * Scoring rules:
 * - Evidence(for) = +1, Evidence(against) = -1
 * - Perspective(for) = +0.5, Perspective(against) = -0.5
 * - If total votes (upvotes + downvotes) > 10, the weight is doubled
 * 
 * @param claimId - The ID of the claim
 * @returns The calculated total score
 */
export async function calculateClaimScore(claimId: mongoose.Types.ObjectId): Promise<number> {
  // Get all approved evidence for this claim
  const evidence = await Evidence.find({
    claimId,
    status: EvidenceStatus.APPROVED,
  })

  // Get all approved perspectives for this claim
  const perspectives = await Perspective.find({
    claimId,
    status: PerspectiveStatus.APPROVED,
  })

  let totalScore = 0

  // Calculate score from evidence
  for (const ev of evidence) {
    const contribution = calculateEvidenceContribution(
      ev.position,
      ev.upvotes,
      ev.downvotes
    )
    totalScore += contribution
  }

  // Calculate score from perspectives
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

/**
 * Update the total score for a claim
 * 
 * @param claimId - The ID of the claim to update
 */
export async function updateClaimScore(claimId: mongoose.Types.ObjectId): Promise<number> {
  const totalScore = await calculateClaimScore(claimId)
  
  const updatedClaim = await Claim.findByIdAndUpdate(
    claimId,
    { totalScore },
    { new: true }
  )
  
  if (!updatedClaim) {
    throw new Error(`Claim with ID ${claimId} not found`)
  }
  
  return totalScore
}


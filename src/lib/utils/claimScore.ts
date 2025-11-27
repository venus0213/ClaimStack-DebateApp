import mongoose from 'mongoose'
import { Evidence, Position, EvidenceStatus } from '@/lib/db/models'
import { Perspective, PerspectiveStatus } from '@/lib/db/models'
import { Claim } from '@/lib/db/models'

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


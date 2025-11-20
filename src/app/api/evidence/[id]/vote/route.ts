import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Evidence } from '@/lib/db/models'
import { Vote, VoteType } from '@/lib/db/models'
import { Claim } from '@/lib/db/models'
import { updateClaimScore } from '@/lib/utils/claimScore'
import mongoose from 'mongoose'
import { z } from 'zod'

const voteSchema = z.object({
  voteType: z.enum(['upvote', 'downvote']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user
    const evidenceId = params.id

    // Ensure database connection
    await connectDB()

    // Validate evidence ID format
    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid evidence ID format' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate input
    const validationResult = voteSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { voteType } = validationResult.data

    // Find the evidence
    const evidence = await Evidence.findById(new mongoose.Types.ObjectId(evidenceId))
    if (!evidence) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Evidence not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = new mongoose.Types.ObjectId(user.userId)
    const evidenceObjectId = new mongoose.Types.ObjectId(evidenceId)

    // Check if user already voted
    const existingVote = await Vote.findOne({
      evidenceId: evidenceObjectId,
      userId,
    })

    const voteTypeEnum = voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE

    if (existingVote) {
      // User already voted - update or remove vote
      if (existingVote.voteType === voteTypeEnum) {
        // Same vote type - remove the vote
        await Vote.findByIdAndDelete(existingVote._id)
        
        // Update vote counts
        if (voteType === 'upvote') {
          evidence.upvotes = Math.max(0, evidence.upvotes - 1)
        } else {
          evidence.downvotes = Math.max(0, evidence.downvotes - 1)
        }
      } else {
        // Different vote type - update the vote
        const oldVoteType = existingVote.voteType
        
        // Decrement old vote count
        if (oldVoteType === VoteType.UPVOTE) {
          evidence.upvotes = Math.max(0, evidence.upvotes - 1)
        } else {
          evidence.downvotes = Math.max(0, evidence.downvotes - 1)
        }
        
        // Increment new vote count
        if (voteType === 'upvote') {
          evidence.upvotes += 1
        } else {
          evidence.downvotes += 1
        }
        
        // Update vote
        existingVote.voteType = voteTypeEnum
        await existingVote.save()
      }
    } else {
      // New vote
      await Vote.create({
        evidenceId: evidenceObjectId,
        userId,
        voteType: voteTypeEnum,
      })
      
      // Update vote counts
      if (voteType === 'upvote') {
        evidence.upvotes += 1
      } else {
        evidence.downvotes += 1
      }
    }

    // Update score (upvotes - downvotes)
    evidence.score = evidence.upvotes - evidence.downvotes
    await evidence.save()

    // Update claim total score - this recalculates based on all evidence/perspectives
    const updatedTotalScore = await updateClaimScore(evidence.claimId)

    // Get updated claim with new score
    const updatedClaim = await Claim.findById(evidence.claimId)

    // Get updated vote status
    const currentVote = await Vote.findOne({
      evidenceId: evidenceObjectId,
      userId,
    })

    return NextResponse.json({
      success: true,
      evidence: {
        id: evidence._id.toString(),
        upvotes: evidence.upvotes,
        downvotes: evidence.downvotes,
        score: evidence.score,
      },
      userVote: currentVote ? (currentVote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote') : null,
      claim: updatedClaim ? {
        id: updatedClaim._id.toString(),
        totalScore: updatedClaim.totalScore || 0,
      } : undefined,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on evidence'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}


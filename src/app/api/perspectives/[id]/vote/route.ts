import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Perspective } from '@/lib/db/models'
import { PerspectiveVote } from '@/lib/db/models'
import { VoteType } from '@/lib/db/models'
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
    const perspectiveId = params.id

    // Ensure database connection
    await connectDB()

    // Validate perspective ID format
    if (!mongoose.Types.ObjectId.isValid(perspectiveId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid perspective ID format' 
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

    // Find the perspective
    const perspective = await Perspective.findById(new mongoose.Types.ObjectId(perspectiveId))
    if (!perspective) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Perspective not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = new mongoose.Types.ObjectId(user.userId)
    const perspectiveObjectId = new mongoose.Types.ObjectId(perspectiveId)

    // Check if user already voted
    const existingVote = await PerspectiveVote.findOne({
      perspectiveId: perspectiveObjectId,
      userId,
    })

    const voteTypeEnum = voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE

    if (existingVote) {
      // User already voted - update or remove vote
      if (existingVote.voteType === voteTypeEnum) {
        // Same vote type - remove the vote
        await PerspectiveVote.findByIdAndDelete(existingVote._id)
        
        // Update vote counts
        if (voteType === 'upvote') {
          perspective.upvotes = Math.max(0, perspective.upvotes - 1)
        } else {
          perspective.downvotes = Math.max(0, perspective.downvotes - 1)
        }
      } else {
        // Different vote type - update the vote
        const oldVoteType = existingVote.voteType
        
        // Decrement old vote count
        if (oldVoteType === VoteType.UPVOTE) {
          perspective.upvotes = Math.max(0, perspective.upvotes - 1)
        } else {
          perspective.downvotes = Math.max(0, perspective.downvotes - 1)
        }
        
        // Increment new vote count
        if (voteType === 'upvote') {
          perspective.upvotes += 1
        } else {
          perspective.downvotes += 1
        }
        
        // Update vote
        existingVote.voteType = voteTypeEnum
        await existingVote.save()
      }
    } else {
      // New vote
      await PerspectiveVote.create({
        perspectiveId: perspectiveObjectId,
        userId,
        voteType: voteTypeEnum,
      })
      
      // Update vote counts
      if (voteType === 'upvote') {
        perspective.upvotes += 1
      } else {
        perspective.downvotes += 1
      }
    }

    // Update score (upvotes - downvotes)
    perspective.score = perspective.upvotes - perspective.downvotes
    await perspective.save()

    // Update claim total score - this recalculates based on all evidence/perspectives
    const updatedTotalScore = await updateClaimScore(perspective.claimId)

    // Get updated claim with new score
    const updatedClaim = await Claim.findById(perspective.claimId)

    // Get updated vote status
    const currentVote = await PerspectiveVote.findOne({
      perspectiveId: perspectiveObjectId,
      userId,
    })

    return NextResponse.json({
      success: true,
      perspective: {
        id: perspective._id.toString(),
        upvotes: perspective.upvotes,
        downvotes: perspective.downvotes,
        score: perspective.score,
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on perspective'
    
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


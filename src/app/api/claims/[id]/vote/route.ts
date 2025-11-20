import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Claim } from '@/lib/db/models'
import { ClaimVote, VoteType } from '@/lib/db/models'
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
    const claimId = params.id

    // Ensure database connection
    await connectDB()

    // Validate claim ID format
    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid claim ID format' 
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

    // Find the claim
    const claim = await Claim.findById(new mongoose.Types.ObjectId(claimId))
    if (!claim) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Claim not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = new mongoose.Types.ObjectId(user.userId)
    const claimObjectId = new mongoose.Types.ObjectId(claimId)

    // Check if user already voted
    const existingVote = await ClaimVote.findOne({
      claimId: claimObjectId,
      userId,
    })

    const voteTypeEnum = voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE

    if (existingVote) {
      // User already voted - update or remove vote
      if (existingVote.voteType === voteTypeEnum) {
        // Same vote type - remove the vote
        await ClaimVote.findByIdAndDelete(existingVote._id)
        
        // Update vote counts
        if (voteType === 'upvote') {
          claim.upvotes = Math.max(0, claim.upvotes - 1)
        } else {
          claim.downvotes = Math.max(0, claim.downvotes - 1)
        }
      } else {
        // Different vote type - update the vote
        const oldVoteType = existingVote.voteType
        
        // Decrement old vote count
        if (oldVoteType === VoteType.UPVOTE) {
          claim.upvotes = Math.max(0, claim.upvotes - 1)
        } else {
          claim.downvotes = Math.max(0, claim.downvotes - 1)
        }
        
        // Increment new vote count
        if (voteType === 'upvote') {
          claim.upvotes += 1
        } else {
          claim.downvotes += 1
        }
        
        // Update vote
        existingVote.voteType = voteTypeEnum
        await existingVote.save()
      }
    } else {
      // New vote
      await ClaimVote.create({
        claimId: claimObjectId,
        userId,
        voteType: voteTypeEnum,
      })
      
      // Update vote counts
      if (voteType === 'upvote') {
        claim.upvotes += 1
      } else {
        claim.downvotes += 1
      }
    }

    await claim.save()

    // Get updated vote status
    const currentVote = await ClaimVote.findOne({
      claimId: claimObjectId,
      userId,
    })

    return NextResponse.json({
      success: true,
      claim: {
        id: claim._id.toString(),
        upvotes: claim.upvotes,
        downvotes: claim.downvotes,
      },
      userVote: currentVote ? (currentVote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote') : null,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on claim'
    
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


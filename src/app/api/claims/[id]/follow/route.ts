import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Claim } from '@/lib/db/models'
import { ClaimFollow } from '@/lib/db/models'
import mongoose from 'mongoose'

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

    // Check if user already follows
    const existingFollow = await ClaimFollow.findOne({
      claimId: claimObjectId,
      userId,
    })

    let isFollowing = false

    if (existingFollow) {
      // Unfollow - remove the follow
      await ClaimFollow.findByIdAndDelete(existingFollow._id)
      claim.followCount = Math.max(0, claim.followCount - 1)
      isFollowing = false
    } else {
      // Follow - create new follow
      await ClaimFollow.create({
        claimId: claimObjectId,
        userId,
      })
      claim.followCount += 1
      isFollowing = true
    }

    await claim.save()

    return NextResponse.json({
      success: true,
      claim: {
        id: claim._id.toString(),
        followCount: claim.followCount,
      },
      isFollowing,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to follow/unfollow claim'
    
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


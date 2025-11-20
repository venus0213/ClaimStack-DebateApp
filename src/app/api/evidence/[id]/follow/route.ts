import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Evidence } from '@/lib/db/models'
import { EvidenceFollow } from '@/lib/db/models'
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

    // Check if user already follows
    const existingFollow = await EvidenceFollow.findOne({
      evidenceId: evidenceObjectId,
      userId,
    })

    let isFollowing = false

    if (existingFollow) {
      // Unfollow - remove the follow
      await EvidenceFollow.findByIdAndDelete(existingFollow._id)
      evidence.followCount = Math.max(0, evidence.followCount - 1)
      isFollowing = false
    } else {
      // Follow - create new follow
      await EvidenceFollow.create({
        evidenceId: evidenceObjectId,
        userId,
      })
      evidence.followCount += 1
      isFollowing = true
    }

    await evidence.save()

    return NextResponse.json({
      success: true,
      evidence: {
        id: evidence._id.toString(),
        followCount: evidence.followCount,
      },
      isFollowing,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to follow/unfollow evidence'
    
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


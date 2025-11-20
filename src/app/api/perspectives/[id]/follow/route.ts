import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Perspective } from '@/lib/db/models'
import { PerspectiveFollow } from '@/lib/db/models'
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

    // Check if user already follows
    const existingFollow = await PerspectiveFollow.findOne({
      perspectiveId: perspectiveObjectId,
      userId,
    })

    let isFollowing = false

    if (existingFollow) {
      // Unfollow - remove the follow
      await PerspectiveFollow.findByIdAndDelete(existingFollow._id)
      perspective.followCount = Math.max(0, perspective.followCount - 1)
      isFollowing = false
    } else {
      // Follow - create new follow
      await PerspectiveFollow.create({
        perspectiveId: perspectiveObjectId,
        userId,
      })
      perspective.followCount += 1
      isFollowing = true
    }

    await perspective.save()

    return NextResponse.json({
      success: true,
      perspective: {
        id: perspective._id.toString(),
        followCount: perspective.followCount,
      },
      isFollowing,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to follow/unfollow perspective'
    
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


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { UserFollow } from '@/lib/db/models'
import { getSessionFromRequest } from '@/lib/auth/session'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure database connection
    await connectDB()

    const userId = params.id

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid user ID format' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Find the user
    const user = await User.findById(new mongoose.Types.ObjectId(userId))
      .select('-passwordHash -__v')
      .lean()

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get follow status if authenticated
    let isFollowing = false
    try {
      const session = await getSessionFromRequest()
      if (session) {
        const followerId = new mongoose.Types.ObjectId(session.userId)
        const followingId = new mongoose.Types.ObjectId(userId)
        const follow = await UserFollow.findOne({
          followerId,
          followingId,
        })
        isFollowing = !!follow
      }
    } catch (error) {
      // If not authenticated, isFollowing remains false
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
      isFollowing,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user'
    
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


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { UserFollow } from '@/lib/db/models'
import { NotificationType } from '@/lib/db/models'
import { createNotification } from '@/lib/utils/notifications'
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
    const followingUserId = params.id

    // Ensure database connection
    await connectDB()

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(followingUserId)) {
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

    // Prevent users from following themselves
    if (user.userId === followingUserId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot follow yourself' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const followerId = new mongoose.Types.ObjectId(user.userId)
    const followingId = new mongoose.Types.ObjectId(followingUserId)

    // Check if user already follows
    const existingFollow = await UserFollow.findOne({
      followerId,
      followingId,
    })

    let isFollowing = false

    if (existingFollow) {
      // Unfollow - remove the follow
      await UserFollow.findByIdAndDelete(existingFollow._id)
      isFollowing = false
    } else {
      // Follow - create new follow
      await UserFollow.create({
        followerId,
        followingId,
      })
      isFollowing = true

      // Notify the followed user about the new follower
      const followerUsername = user.username || 'Someone'
      createNotification({
        userId: followingUserId,
        type: NotificationType.NEW_FOLLOWER,
        title: 'New follower',
        message: `@${followerUsername} started following you`,
        link: `/profile/${user.userId}`,
      }).catch((error) => {
        console.error('Error notifying user about new follower:', error)
      })
    }

    return NextResponse.json({
      success: true,
      isFollowing,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to follow/unfollow user'
    
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


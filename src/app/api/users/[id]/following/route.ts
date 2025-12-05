import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { UserFollow } from '@/lib/db/models'
import { User } from '@/lib/db/models'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const userId = params.id

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid user ID format',
          following: []
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      // Return only the count for efficiency
      const count = await UserFollow.countDocuments({ followerId: userObjectId })
      return NextResponse.json({
        success: true,
        count,
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    // Fetch following (users that this user follows)
    const follows = await UserFollow.find({ followerId: userObjectId })
      .populate('followingId', 'username firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .lean()

    // Transform to API format
    const following = follows.map((follow: any) => ({
      id: follow.followingId._id?.toString() || follow.followingId.toString(),
      username: follow.followingId.username,
      firstName: follow.followingId.firstName,
      lastName: follow.followingId.lastName,
      avatarUrl: follow.followingId.avatarUrl,
      createdAt: follow.createdAt,
    }))

    return NextResponse.json({
      success: true,
      following,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch following'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        following: []
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


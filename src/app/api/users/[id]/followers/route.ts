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
          followers: []
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
      const count = await UserFollow.countDocuments({ followingId: userObjectId })
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

    // Fetch followers (users who follow this user)
    const follows = await UserFollow.find({ followingId: userObjectId })
      .populate('followerId', 'username firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .lean()

    // Transform to API format
    const followers = follows.map((follow: any) => ({
      id: follow.followerId._id?.toString() || follow.followerId.toString(),
      username: follow.followerId.username,
      firstName: follow.followerId.firstName,
      lastName: follow.followerId.lastName,
      avatarUrl: follow.followerId.avatarUrl,
      createdAt: follow.createdAt,
    }))

    return NextResponse.json({
      success: true,
      followers,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch followers'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        followers: []
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


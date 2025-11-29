import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { Claim, ClaimStatus } from '@/lib/db/models'
import { Evidence, EvidenceStatus } from '@/lib/db/models'
import { Perspective, PerspectiveStatus } from '@/lib/db/models'
import mongoose from 'mongoose'

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Aggregate upvotes from Claims, Evidence, and Perspectives
    // We'll use MongoDB aggregation to sum upvotes by userId

    // Get upvotes from Claims
    const claimUpvotes = await Claim.aggregate([
      {
        $match: {
          status: ClaimStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: '$userId',
          totalUpvotes: { $sum: { $ifNull: ['$upvotes', 0] } },
        },
      },
    ])

    // Get upvotes from Evidence
    const evidenceUpvotes = await Evidence.aggregate([
      {
        $match: {
          status: EvidenceStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: '$userId',
          totalUpvotes: { $sum: { $ifNull: ['$upvotes', 0] } },
        },
      },
    ])

    // Get upvotes from Perspectives
    const perspectiveUpvotes = await Perspective.aggregate([
      {
        $match: {
          status: PerspectiveStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: '$userId',
          totalUpvotes: { $sum: { $ifNull: ['$upvotes', 0] } },
        },
      },
    ])

    // Combine all upvotes by userId
    const userUpvotesMap = new Map<string, number>()

    // Add claim upvotes
    claimUpvotes.forEach((item) => {
      const userId = item._id.toString()
      const current = userUpvotesMap.get(userId) || 0
      userUpvotesMap.set(userId, current + item.totalUpvotes)
    })

    // Add evidence upvotes
    evidenceUpvotes.forEach((item) => {
      const userId = item._id.toString()
      const current = userUpvotesMap.get(userId) || 0
      userUpvotesMap.set(userId, current + item.totalUpvotes)
    })

    // Add perspective upvotes
    perspectiveUpvotes.forEach((item) => {
      const userId = item._id.toString()
      const current = userUpvotesMap.get(userId) || 0
      userUpvotesMap.set(userId, current + item.totalUpvotes)
    })

    // Convert map to array and sort by total upvotes
    const userUpvotesArray = Array.from(userUpvotesMap.entries())
      .map(([userId, totalUpvotes]) => ({
        userId: new mongoose.Types.ObjectId(userId),
        totalUpvotes,
      }))
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      .slice(0, limit)

    // Get user IDs
    const userIds = userUpvotesArray.map((item) => item.userId)

    // Fetch user details
    const users = await User.find({ _id: { $in: userIds } })
      .select('username firstName lastName avatarUrl')
      .lean()

    // Create a map for quick lookup
    const userMap = new Map(
      users.map((user: any) => [user._id.toString(), user])
    )

    // Combine user data with upvote counts, maintaining sort order
    const topUsers = userUpvotesArray
      .map((item) => {
        const user = userMap.get(item.userId.toString())
        if (!user) return null

        return {
          id: user._id.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          totalUpvotes: item.totalUpvotes,
        }
      })
      .filter((user) => user !== null)

    return NextResponse.json({
      success: true,
      users: topUsers,
    })
  } catch (error) {
    console.error('Error fetching top users:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top users',
        details: errorMessage,
        users: [],
      },
      { status: 500 }
    )
  }
}


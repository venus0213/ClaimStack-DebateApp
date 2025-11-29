import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { optionalAuth } from '@/lib/auth/middleware'
import { Vote, VoteType } from '@/lib/db/models'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const evidenceId = params.id
    const { searchParams } = new URL(request.url)
    const voteType = searchParams.get('voteType') as 'upvote' | 'downvote' | null

    // Validate evidence ID format
    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid evidence ID format',
          voters: []
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const evidenceObjectId = new mongoose.Types.ObjectId(evidenceId)

    // Build query
    const query: any = { evidenceId: evidenceObjectId }
    if (voteType) {
      query.voteType = voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE
    }

    // Fetch votes with user information
    const votes = await Vote.find(query)
      .populate('userId', 'username firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .lean()

    // Transform to API format
    const voters = votes.map((vote: any) => ({
      id: vote._id.toString(),
      userId: vote.userId._id?.toString() || vote.userId.toString(),
      voteType: vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote',
      user: {
        id: vote.userId._id?.toString() || vote.userId.toString(),
        username: vote.userId.username,
        firstName: vote.userId.firstName,
        lastName: vote.userId.lastName,
        avatarUrl: vote.userId.avatarUrl,
      },
      createdAt: vote.createdAt,
    }))

    return NextResponse.json({
      success: true,
      voters,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch voters'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        voters: []
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


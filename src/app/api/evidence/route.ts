import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { optionalAuth } from '@/lib/auth/middleware'
import { Evidence, EvidenceStatus } from '@/lib/db/models'
import { Vote, VoteType } from '@/lib/db/models'
import { EvidenceFollow } from '@/lib/db/models'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')
    const position = searchParams.get('position') as 'for' | 'against' | null
    const sort = searchParams.get('sort') || 'recent'

    if (!claimId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Claim ID is required',
          evidence: []
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate claim ID format
    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid claim ID format',
          evidence: []
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Build query
    const query: any = {
      claimId: new mongoose.Types.ObjectId(claimId),
      // Show both approved and pending evidence
      status: { $in: [EvidenceStatus.APPROVED, EvidenceStatus.PENDING] },
    }

    if (position) {
      query.position = position.toUpperCase()
    }

    // Build sort
    let sortOption: any = { createdAt: -1 } // Default: most recent first
    if (sort === 'score') {
      sortOption = { score: -1 }
    } else if (sort === 'votes') {
      sortOption = { upvotes: -1 }
    }

    // Fetch evidence
    const evidenceDocs = await Evidence.find(query)
      .sort(sortOption)
      .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
      .populate('claimId', 'title')
      .lean()

    // Get user vote and follow status if authenticated
    const user = await optionalAuth(request)
    let userVotes: Map<string, 'upvote' | 'downvote'> = new Map()
    let userFollows: Set<string> = new Set()
    
    if (user) {
      const userId = new mongoose.Types.ObjectId(user.userId)
      const evidenceIds = evidenceDocs.map((doc: any) => new mongoose.Types.ObjectId(doc._id))
      
      // Get all votes
      const votes = await Vote.find({
        evidenceId: { $in: evidenceIds },
        userId,
      })
      votes.forEach((vote) => {
        const evidenceId = vote.evidenceId.toString()
        userVotes.set(evidenceId, vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote')
      })
      
      // Get all follows
      const follows = await EvidenceFollow.find({
        evidenceId: { $in: evidenceIds },
        userId,
      })
      follows.forEach((follow) => {
        userFollows.add(follow.evidenceId.toString())
      })
    }

    // Transform to API format
    const evidence = evidenceDocs.map((doc: any) => {
      // Handle userId - could be ObjectId or populated object
      const userIdValue = doc.userId
      const userIdString = userIdValue?._id?.toString() || userIdValue?.toString() || ''
      
      // Handle claimId - could be ObjectId or populated object
      const claimIdValue = doc.claimId
      const claimIdString = claimIdValue?._id?.toString() || claimIdValue?.toString() || ''
      
      // Check if userId is populated (has email/username fields)
      const isUserIdPopulated = userIdValue && typeof userIdValue === 'object' && 'email' in userIdValue
      
      // Check if claimId is populated (has title field)
      const isClaimIdPopulated = claimIdValue && typeof claimIdValue === 'object' && 'title' in claimIdValue

      return {
        id: doc._id.toString(),
        claimId: claimIdString,
        userId: userIdString,
        type: doc.type?.toLowerCase() || 'text',
        position: doc.position?.toLowerCase() as 'for' | 'against',
        title: doc.title,
        description: doc.description,
        url: doc.url,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        metadata: doc.metadata,
        status: doc.status?.toLowerCase() || 'pending',
        upvotes: doc.upvotes || 0,
        downvotes: doc.downvotes || 0,
        score: doc.score || 0,
        followCount: doc.followCount || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        userVote: userVotes.get(doc._id.toString()) || null,
        isFollowing: userFollows.has(doc._id.toString()),
        user: isUserIdPopulated ? {
          id: userIdValue._id?.toString() || userIdString,
          email: userIdValue.email,
          username: userIdValue.username,
          firstName: userIdValue.firstName,
          lastName: userIdValue.lastName,
          avatarUrl: userIdValue.avatarUrl,
          role: userIdValue.role || 'user',
          createdAt: userIdValue.createdAt,
        } : undefined,
        claim: isClaimIdPopulated ? {
          id: claimIdValue._id?.toString() || claimIdString,
          title: claimIdValue.title,
        } : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      evidence,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evidence'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        evidence: []
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


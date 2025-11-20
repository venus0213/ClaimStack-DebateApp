import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth, optionalAuth } from '@/lib/auth/middleware'
import { Claim, ClaimStatus } from '@/lib/db/models'
import { ClaimFollow, ClaimVote, VoteType } from '@/lib/db/models'
import { ModerationLog, ModerationAction } from '@/lib/db/models'
import { updateClaimScore } from '@/lib/utils/claimScore'
import mongoose from 'mongoose'
import { z } from 'zod'

const updateClaimStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    let claim = await Claim.findById(new mongoose.Types.ObjectId(claimId))
      .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
      .populate('categoryId', 'name slug description')

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

    // Recalculate and update claim score to ensure it's accurate
    try {
      await updateClaimScore(claim._id)
      // Refetch claim to get updated score
      const refetchedClaim = await Claim.findById(claim._id)
        .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
        .populate('categoryId', 'name slug description')
      if (refetchedClaim) {
        claim = refetchedClaim
      }
    } catch (error) {
      console.error('Error updating claim score:', error)
      // Continue even if score update fails
    }

    // Ensure claim is still available after refetch
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

    // Get user follow and vote status if authenticated
    let isFollowing = false
    let userVote: 'upvote' | 'downvote' | null = null
    const user = await optionalAuth(request)
    if (user) {
      const userId = new mongoose.Types.ObjectId(user.userId)
      const claimObjectId = new mongoose.Types.ObjectId(claimId)
      
      const follow = await ClaimFollow.findOne({
        claimId: claimObjectId,
        userId,
      })
      isFollowing = !!follow
      
      const vote = await ClaimVote.findOne({
        claimId: claimObjectId,
        userId,
      })
      if (vote) {
        userVote = vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote'
      }
    }

    const userId = claim.userId instanceof mongoose.Types.ObjectId 
      ? claim.userId.toString() 
      : (claim.userId as any)?._id?.toString() || (claim.userId as any).toString()
    
    const categoryIdString = claim.categoryId 
      ? (claim.categoryId instanceof mongoose.Types.ObjectId 
          ? claim.categoryId.toString() 
          : (claim.categoryId as any)?._id?.toString() || (claim.categoryId as any).toString())
      : undefined

    return NextResponse.json({
      success: true,
      claim: {
        id: claim._id.toString(),
        userId,
        title: claim.title,
        description: claim.description,
        categoryId: categoryIdString,
        status: claim.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
        forSummary: claim.forSummary,
        againstSummary: claim.againstSummary,
        summaryUpdatedAt: claim.summaryUpdatedAt,
        viewCount: claim.viewCount,
        followCount: claim.followCount || 0,
        totalScore: claim.totalScore || 0,
        upvotes: claim.upvotes || 0,
        downvotes: claim.downvotes || 0,
        url: claim.url,
        fileUrl: claim.fileUrl,
        fileName: claim.fileName,
        fileSize: claim.fileSize,
        fileType: claim.fileType,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        user: claim.userId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (claim.userId as any)._id?.toString() || userId,
          email: (claim.userId as any).email,
          username: (claim.userId as any).username,
          firstName: (claim.userId as any).firstName,
          lastName: (claim.userId as any).lastName,
          avatarUrl: (claim.userId as any).avatarUrl,
          role: (claim.userId as any).role || 'user',
          createdAt: (claim.userId as any).createdAt,
        },
        category: claim.categoryId && !(claim.categoryId instanceof mongoose.Types.ObjectId) ? {
          id: (claim.categoryId as any)._id?.toString() || categoryIdString,
          name: (claim.categoryId as any).name,
          slug: (claim.categoryId as any).slug,
          description: (claim.categoryId as any).description,
        } : undefined,
      },
      isFollowing,
      userVote,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claim'
    
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

export async function PATCH(
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

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate input
    const validationResult = updateClaimStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { status, reason, metadata } = validationResult.data

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

    // Update claim status
    const newStatus = status.toUpperCase() as ClaimStatus
    claim.status = newStatus
    await claim.save()

    // Log moderation action
    let moderationAction: ModerationAction
    if (newStatus === ClaimStatus.APPROVED) {
      moderationAction = ModerationAction.APPROVE_CLAIM
    } else if (newStatus === ClaimStatus.REJECTED) {
      moderationAction = ModerationAction.REJECT_CLAIM
    } else if (newStatus === ClaimStatus.FLAGGED) {
      moderationAction = ModerationAction.FLAG_CLAIM
    } else {
      moderationAction = ModerationAction.APPROVE_CLAIM // Default fallback
    }

    await ModerationLog.create({
      moderatorId: new mongoose.Types.ObjectId(user.userId),
      action: moderationAction,
      targetType: 'claim',
      targetId: claimId,
      reason: reason,
      metadata: metadata || {},
    })

    // Populate claim with user and category for response
    await claim.populate('userId', 'username email firstName lastName avatarUrl')
    await claim.populate('categoryId', 'name slug')

    const populatedClaim = await Claim.findById(claim._id)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('categoryId', 'name slug')

    if (!populatedClaim) {
      throw new Error('Failed to retrieve updated claim')
    }

    const userId = populatedClaim.userId instanceof mongoose.Types.ObjectId 
      ? populatedClaim.userId.toString() 
      : (populatedClaim.userId as any)?._id?.toString() || (populatedClaim.userId as any).toString()
    
    const categoryIdString = populatedClaim.categoryId 
      ? (populatedClaim.categoryId instanceof mongoose.Types.ObjectId 
          ? populatedClaim.categoryId.toString() 
          : (populatedClaim.categoryId as any)?._id?.toString() || (populatedClaim.categoryId as any).toString())
      : undefined

    return NextResponse.json({
      success: true,
      claim: {
        id: populatedClaim._id.toString(),
        userId,
        title: populatedClaim.title,
        description: populatedClaim.description,
        categoryId: categoryIdString,
        status: populatedClaim.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
        viewCount: populatedClaim.viewCount,
        createdAt: populatedClaim.createdAt,
        updatedAt: populatedClaim.updatedAt,
        user: populatedClaim.userId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (populatedClaim.userId as any)._id?.toString() || userId,
          email: (populatedClaim.userId as any).email,
          username: (populatedClaim.userId as any).username,
          firstName: (populatedClaim.userId as any).firstName,
          lastName: (populatedClaim.userId as any).lastName,
          avatarUrl: (populatedClaim.userId as any).avatarUrl,
          role: (populatedClaim.userId as any).role || 'user',
          createdAt: (populatedClaim.userId as any).createdAt,
        },
        category: populatedClaim.categoryId && !(populatedClaim.categoryId instanceof mongoose.Types.ObjectId) ? {
          id: (populatedClaim.categoryId as any)._id?.toString() || categoryIdString,
          name: (populatedClaim.categoryId as any).name,
          slug: (populatedClaim.categoryId as any).slug,
          description: (populatedClaim.categoryId as any).description,
        } : undefined,
      },
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update claim status'
    
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


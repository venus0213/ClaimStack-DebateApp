import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth, optionalAuth } from '@/lib/auth/middleware'
import { Claim, ClaimStatus } from '@/lib/db/models'
import { ClaimFollow, ClaimVote, VoteType } from '@/lib/db/models'
import { ModerationLog, ModerationAction } from '@/lib/db/models'
import { Evidence } from '@/lib/db/models'
import { Perspective } from '@/lib/db/models'
import { Vote } from '@/lib/db/models'
import { PerspectiveVote } from '@/lib/db/models'
import { EvidenceFollow } from '@/lib/db/models'
import { PerspectiveFollow } from '@/lib/db/models'
import { NotificationType } from '@/lib/db/models'
import { updateClaimScore } from '@/lib/utils/claimScore'
import { deleteFile } from '@/lib/storage/upload'
import { createNotification, notifyAllUsers } from '@/lib/utils/notifications'
import mongoose from 'mongoose'
import { z } from 'zod'

const updateClaimStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged', 'closed']),
  reason: z.string().optional(),
  rejectionFeedback: z.string().optional(),
  notifyUser: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  titleEditReason: z.string().optional(),
  descriptionEditReason: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id

    await connectDB()

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

    try {
      await updateClaimScore(claim._id)
      const refetchedClaim = await Claim.findById(claim._id)
        .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
        .populate('categoryId', 'name slug description')
      if (refetchedClaim) {
        claim = refetchedClaim
      }
    } catch (error) {
      console.error('Error updating claim score:', error)
    }

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

    const isAdmin = user && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'MODERATOR')
    const isCreator = user && userId === user.userId

    const claimResponse: any = {
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
      seoTitle: claim.seoTitle,
      seoDescription: claim.seoDescription,
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
    }

    if (isAdmin || isCreator) {
      claimResponse.originalTitle = claim.originalTitle
      claimResponse.titleEdited = claim.titleEdited || false
      claimResponse.titleEditedBy = claim.titleEditedBy?.toString()
      claimResponse.titleEditedAt = claim.titleEditedAt
      claimResponse.titleEditReason = claim.titleEditReason
      claimResponse.originalDescription = claim.originalDescription
      claimResponse.descriptionEdited = claim.descriptionEdited || false
      claimResponse.descriptionEditedBy = claim.descriptionEditedBy?.toString()
      claimResponse.descriptionEditedAt = claim.descriptionEditedAt
      claimResponse.descriptionEditReason = claim.descriptionEditReason
    }

    if (isCreator && claim.status === ClaimStatus.REJECTED) {
      claimResponse.rejectionFeedback = claim.rejectionFeedback
    }

    return NextResponse.json({
      success: true,
      claim: claimResponse,
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
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user
    const claimId = params.id

    await connectDB()

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

    const { status, reason, rejectionFeedback, notifyUser, metadata, title, description, seoTitle, seoDescription, titleEditReason, descriptionEditReason } = validationResult.data

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

    if (title !== undefined && title !== claim.title) {
      if (!claim.titleEdited && !claim.originalTitle) {
        claim.originalTitle = claim.title
      }
      
      claim.title = title
      
      claim.titleEdited = true
      claim.titleEditedBy = new mongoose.Types.ObjectId(user.userId)
      claim.titleEditedAt = new Date()
      
      if (!titleEditReason || !titleEditReason.trim()) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Edit reason is required when editing title' 
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      claim.titleEditReason = titleEditReason
    }

    if (description !== undefined && description !== (claim.description || '')) {
      if (!claim.descriptionEdited && !claim.originalDescription) {
        claim.originalDescription = claim.description
      }
      
      claim.description = description
      
      claim.descriptionEdited = true
      claim.descriptionEditedBy = new mongoose.Types.ObjectId(user.userId)
      claim.descriptionEditedAt = new Date()
      
      if (!descriptionEditReason || !descriptionEditReason.trim()) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Edit reason is required when editing description' 
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      claim.descriptionEditReason = descriptionEditReason
    }

    if (seoTitle !== undefined) {
      claim.seoTitle = seoTitle
    }
    if (seoDescription !== undefined) {
      claim.seoDescription = seoDescription
    }

    const newStatus = status.toUpperCase() as ClaimStatus
    claim.status = newStatus
    
    if (rejectionFeedback && newStatus === ClaimStatus.REJECTED) {
      claim.rejectionFeedback = rejectionFeedback
    }
    
    await claim.save()

    let moderationAction: ModerationAction
    if (newStatus === ClaimStatus.APPROVED) {
      moderationAction = ModerationAction.APPROVE_CLAIM
    } else if (newStatus === ClaimStatus.REJECTED) {
      moderationAction = ModerationAction.REJECT_CLAIM
    } else if (newStatus === ClaimStatus.FLAGGED) {
      moderationAction = ModerationAction.FLAG_CLAIM
    } else if (newStatus === ClaimStatus.CLOSED) {
      moderationAction = ModerationAction.APPROVE_CLAIM
    } else {
      moderationAction = ModerationAction.APPROVE_CLAIM
    }

    await ModerationLog.create({
      moderatorId: new mongoose.Types.ObjectId(user.userId),
      action: moderationAction,
      targetType: 'claim',
      targetId: claimId,
      reason: reason,
      metadata: metadata || {},
    })

    if (newStatus === ClaimStatus.APPROVED) {
      const claimUserId = claim.userId instanceof mongoose.Types.ObjectId
        ? claim.userId.toString()
        : (claim.userId as any)?._id?.toString() || (claim.userId as any).toString()

      createNotification({
        userId: claimUserId,
        type: NotificationType.CLAIM_APPROVED,
        title: 'Your claim has been approved',
        message: `"${claim.title}" has been approved and is now live on the platform`,
        link: `/claims/${claim._id.toString()}`,
      }).catch((error) => {
        console.error('Error notifying user about claim approval:', error)
      })

      notifyAllUsers({
        type: NotificationType.NEW_CLAIM,
        title: 'New claim published',
        message: `"${claim.title}" has been published`,
        link: `/claims/${claim._id.toString()}`,
      }).catch((error) => {
        console.error('Error notifying all users about new claim:', error)
      })
    }

    if (newStatus === ClaimStatus.REJECTED && notifyUser) {
      const claimUserId = claim.userId instanceof mongoose.Types.ObjectId
        ? claim.userId.toString()
        : (claim.userId as any)?._id?.toString() || (claim.userId as any).toString()

      const feedbackMessage = rejectionFeedback || reason || 'Your claim has been rejected.'
      
      createNotification({
        userId: claimUserId,
        type: NotificationType.CLAIM_REJECTED,
        title: 'Your claim has been rejected',
        message: feedbackMessage,
        link: `/claims/${claim._id.toString()}?showRejection=true`,
      }).catch((error) => {
        console.error('Error notifying user about claim rejection:', error)
      })
    }

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
        seoTitle: populatedClaim.seoTitle,
        seoDescription: populatedClaim.seoDescription,
        originalTitle: populatedClaim.originalTitle,
        titleEdited: populatedClaim.titleEdited,
        titleEditedBy: populatedClaim.titleEditedBy?.toString(),
        titleEditedAt: populatedClaim.titleEditedAt,
        titleEditReason: populatedClaim.titleEditReason,
        originalDescription: populatedClaim.originalDescription,
        descriptionEdited: populatedClaim.descriptionEdited,
        descriptionEditedBy: populatedClaim.descriptionEditedBy?.toString(),
        descriptionEditedAt: populatedClaim.descriptionEditedAt,
        descriptionEditReason: populatedClaim.descriptionEditReason,
        rejectionFeedback: populatedClaim.rejectionFeedback,
        expeditedReview: populatedClaim.expeditedReview,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user
    const claimId = params.id

    await connectDB()

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

    const userRole = user.role?.toUpperCase()
    const isAdmin = userRole === 'ADMIN'
    
    const claimUserId = claim.userId instanceof mongoose.Types.ObjectId
      ? claim.userId.toString()
      : (claim.userId as any)?._id?.toString() || (claim.userId as any).toString()
    
    if (claimUserId !== user.userId && !isAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'You can only delete your own claims' 
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (claim.fileUrl) {
      try {
        await deleteFile(claim.fileUrl)
      } catch (error) {
        console.error('Error deleting claim file:', error)
      }
    }

    const evidenceList = await Evidence.find({ claimId: claim._id })
    const perspectiveList = await Perspective.find({ claimId: claim._id })

    for (const evidence of evidenceList) {
      if (evidence.fileUrl) {
        try {
          await deleteFile(evidence.fileUrl)
        } catch (error) {
          console.error('Error deleting evidence file:', error)
        }
      }
      await Vote.deleteMany({ evidenceId: evidence._id })
      await EvidenceFollow.deleteMany({ evidenceId: evidence._id })
    }

    for (const perspective of perspectiveList) {
      if (perspective.fileUrl) {
        try {
          await deleteFile(perspective.fileUrl)
        } catch (error) {
          console.error('Error deleting perspective file:', error)
        }
      }
      await PerspectiveVote.deleteMany({ perspectiveId: perspective._id })
      await PerspectiveFollow.deleteMany({ perspectiveId: perspective._id })
    }

    await ClaimVote.deleteMany({ claimId: claim._id })
    await ClaimFollow.deleteMany({ claimId: claim._id })
    await Evidence.deleteMany({ claimId: claim._id })
    await Perspective.deleteMany({ claimId: claim._id })
    await claim.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Claim deleted successfully',
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete claim'
    
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


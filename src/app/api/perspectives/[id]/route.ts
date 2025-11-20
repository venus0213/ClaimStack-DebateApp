import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Perspective, PerspectiveStatus } from '@/lib/db/models'
import { Claim } from '@/lib/db/models'
import { updateClaimScore } from '@/lib/utils/claimScore'
import mongoose from 'mongoose'
import { z } from 'zod'

const updatePerspectiveStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  reason: z.string().optional(),
})

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
    const validationResult = updatePerspectiveStatusSchema.safeParse(body)
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

    const { status } = validationResult.data

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

    // Store old status to check if we need to update claim score
    const oldStatus = perspective.status
    const claimId = perspective.claimId

    // Update perspective status
    const newStatus = status.toUpperCase() as PerspectiveStatus
    perspective.status = newStatus
    await perspective.save()

    // Update claim score if status changed to/from APPROVED
    // This ensures the score reflects approved perspectives only
    if (oldStatus !== newStatus && 
        (oldStatus === PerspectiveStatus.APPROVED || newStatus === PerspectiveStatus.APPROVED)) {
      try {
        await updateClaimScore(claimId)
      } catch (error) {
        console.error('Error updating claim score after perspective status change:', error)
        // Don't fail the request if score update fails
      }
    }

    // Get updated claim with recalculated score
    const updatedClaim = await Claim.findById(claimId)

    // Populate perspective for response
    const populatedPerspective = await Perspective.findById(perspective._id)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('claimId', 'title description')

    if (!populatedPerspective) {
      throw new Error('Failed to retrieve updated perspective')
    }

    const perspectiveClaimId = populatedPerspective.claimId instanceof mongoose.Types.ObjectId 
      ? populatedPerspective.claimId.toString() 
      : (populatedPerspective.claimId as any)?._id?.toString() || (populatedPerspective.claimId as any).toString()
    
    const perspectiveUserId = populatedPerspective.userId instanceof mongoose.Types.ObjectId 
      ? populatedPerspective.userId.toString() 
      : (populatedPerspective.userId as any)?._id?.toString() || (populatedPerspective.userId as any).toString()

    return NextResponse.json({
      success: true,
      perspective: {
        id: populatedPerspective._id.toString(),
        claimId: perspectiveClaimId,
        userId: perspectiveUserId,
        title: populatedPerspective.title,
        body: populatedPerspective.body,
        position: populatedPerspective.position.toLowerCase() as 'for' | 'against',
        sourceUrl: populatedPerspective.sourceUrl,
        sourcePlatform: populatedPerspective.sourcePlatform,
        fileUrl: populatedPerspective.fileUrl,
        fileName: populatedPerspective.fileName,
        fileSize: populatedPerspective.fileSize,
        fileType: populatedPerspective.fileType,
        metadata: populatedPerspective.metadata,
        status: populatedPerspective.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
        upvotes: populatedPerspective.upvotes,
        downvotes: populatedPerspective.downvotes,
        score: populatedPerspective.score,
        createdAt: populatedPerspective.createdAt,
        updatedAt: populatedPerspective.updatedAt,
        user: populatedPerspective.userId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (populatedPerspective.userId as any)._id?.toString() || perspectiveUserId,
          email: (populatedPerspective.userId as any).email,
          username: (populatedPerspective.userId as any).username,
          firstName: (populatedPerspective.userId as any).firstName,
          lastName: (populatedPerspective.userId as any).lastName,
          avatarUrl: (populatedPerspective.userId as any).avatarUrl,
          role: (populatedPerspective.userId as any).role || 'user',
          createdAt: (populatedPerspective.userId as any).createdAt,
        },
        claim: populatedPerspective.claimId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (populatedPerspective.claimId as any)?._id?.toString() || perspectiveClaimId,
          title: (populatedPerspective.claimId as any).title,
          description: (populatedPerspective.claimId as any).description,
        } as any,
      },
      claim: updatedClaim ? {
        id: updatedClaim._id.toString(),
        totalScore: updatedClaim.totalScore || 0,
      } : undefined,
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update perspective status'
    
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


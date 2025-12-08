import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Claim } from '@/lib/db/models'
import { Perspective, Position, PerspectiveStatus } from '@/lib/db/models'
import { NotificationType } from '@/lib/db/models'
import { fetchOEmbed } from '@/lib/oembed/client'
import { updateClaimScore } from '@/lib/utils/claimScore'
import { createNotification } from '@/lib/utils/notifications'
import mongoose from 'mongoose'
import { z } from 'zod'

const createPerspectiveSchema = z.object({
  type: z.enum(['url', 'file']).optional(),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  title: z.string().max(500).optional(),
  body: z.string().min(10, 'Body must be at least 10 characters long'),
  position: z.enum(['for', 'against']),
})

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('id')

    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    await connectDB()

    if (!claimId) {
      return NextResponse.json(
        { success: false, error: 'Claim ID is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid claim ID format', receivedId: claimId },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const claim = await Claim.findById(new mongoose.Types.ObjectId(claimId)).select('userId title').lean()
    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { 
          status: 404,
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
    
    const validationResult = createPerspectiveSchema.safeParse(body)
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

    const { type, url, fileUrl, fileName, fileSize, fileType, title, body: bodyText, position } = validationResult.data

    if (type === 'url' && !url) {
      return NextResponse.json(
        { success: false, error: 'URL is required for URL type perspective' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else if (type === 'file' && !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'File URL is required for file type perspective' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const perspectiveData: any = {
      claimId: new mongoose.Types.ObjectId(claimId),
      userId: new mongoose.Types.ObjectId(user.userId),
      position: position.toUpperCase() as Position,
      body: bodyText,
      title: title?.trim() || undefined,
      status: PerspectiveStatus.APPROVED,
      upvotes: 0,
      downvotes: 0,
      score: 0,
    }

    if (type === 'url' && url) {
      let sourcePlatform: string | undefined
      let metadata: Record<string, any> | undefined

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        sourcePlatform = 'youtube'
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            thumbnail: oembedData.thumbnail,
            provider: oembedData.provider,
          }
          if (!title?.trim()) {
            perspectiveData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        sourcePlatform = 'twitter'
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          if (!title?.trim()) {
            perspectiveData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('tiktok.com')) {
        sourcePlatform = 'tiktok'
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          if (!title?.trim()) {
            perspectiveData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('instagram.com')) {
        sourcePlatform = 'instagram'
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          if (!title?.trim()) {
            perspectiveData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      }

      perspectiveData.sourceUrl = url
      perspectiveData.sourcePlatform = sourcePlatform
      perspectiveData.metadata = metadata
    } else if (type === 'file' && fileUrl) {
      perspectiveData.fileUrl = fileUrl
      perspectiveData.fileName = fileName
      perspectiveData.fileSize = fileSize
      perspectiveData.fileType = fileType
    }
    
    const perspective = await Perspective.create(perspectiveData)

    try {
      await updateClaimScore(new mongoose.Types.ObjectId(claimId))
    } catch (error) {
      console.error('Error updating claim score after perspective creation:', error)
      // Don't fail the request if score update fails
    }

    const populatedPerspective = await Perspective.findById(perspective._id)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('claimId', 'title description userId')

    if (!populatedPerspective) {
      throw new Error('Failed to retrieve created perspective')
    }
    
    if (claim) {
      const claimOwnerId = claim.userId instanceof mongoose.Types.ObjectId
        ? claim.userId.toString()
        : (claim.userId as any)?.toString()

      const perspectiveCreatorId = populatedPerspective.userId instanceof mongoose.Types.ObjectId
        ? populatedPerspective.userId.toString()
        : (populatedPerspective.userId as any)?._id?.toString() || (populatedPerspective.userId as any).toString()

      if (claimOwnerId && claimOwnerId !== perspectiveCreatorId) {
        const claimTitle = claim.title || 'your claim'
        const perspectiveTitle = populatedPerspective.title || 'New perspective'
        const creatorUsername = populatedPerspective.userId instanceof mongoose.Types.ObjectId
          ? 'Someone'
          : (populatedPerspective.userId as any)?.username || 'Someone'

        createNotification({
          userId: claimOwnerId,
          type: NotificationType.NEW_PERSPECTIVE,
          title: 'New perspective added to your claim',
          message: `@${creatorUsername} added a new perspective "${perspectiveTitle}" to "${claimTitle}"`,
          link: `/claims/${claimId}`,
        }).catch((error) => {
          console.error('Error notifying claim owner about new perspective:', error)
        })
      }
    }

    const updatedClaim = await Claim.findById(claimId)

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
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create perspective'
    
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


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth, optionalAuth } from '@/lib/auth/middleware'
import { Reply, ReplyStatus } from '@/lib/db/models'
import { Evidence, Perspective } from '@/lib/db/models'
import { NotificationType } from '@/lib/db/models'
import { createNotification } from '@/lib/utils/notifications'
import mongoose from 'mongoose'
import { z } from 'zod'

const createReplySchema = z.object({
  targetType: z.enum(['evidence', 'perspective']),
  targetId: z.string().min(1),
  body: z.string().min(10, 'Reply must be at least 10 characters').max(2000, 'Reply must be at most 2000 characters'),
  links: z.array(z.string().min(1, 'Link cannot be empty')).max(1, 'Maximum 1 link allowed').optional(),
})

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType') as 'evidence' | 'perspective' | null
    const targetId = searchParams.get('targetId')
    const sort = searchParams.get('sort') || 'score' // 'score' or 'recent'

    if (!targetType || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'targetType and targetId are required',
          replies: [],
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!['evidence', 'perspective'].includes(targetType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'targetType must be "evidence" or "perspective"',
          replies: [],
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid targetId format',
          replies: [],
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify target exists
    const targetIdObj = new mongoose.Types.ObjectId(targetId)
    const target = targetType === 'evidence' 
      ? await Evidence.findById(targetIdObj).lean()
      : await Perspective.findById(targetIdObj).lean()
    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: `${targetType} not found`,
          replies: [],
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Build query
    const query: any = {
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      status: ReplyStatus.APPROVED,
    }

    // Sort options
    let sortOption: any = { score: -1, createdAt: -1 }
    if (sort === 'recent') {
      sortOption = { createdAt: -1 }
    }

    // Fetch replies
    const replyDocs = await Reply.find(query)
      .sort(sortOption)
      .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
      .lean()

    // Get user's votes if authenticated
    const user = await optionalAuth(request)
    let userVotes: Map<string, 'upvote' | 'downvote'> = new Map()

    if (user) {
      const { ReplyVote } = await import('@/lib/db/models')
      const { VoteType } = await import('@/lib/db/models')
      const userId = new mongoose.Types.ObjectId(user.userId)
      const replyIds = replyDocs.map((doc: any) => new mongoose.Types.ObjectId(doc._id))

      const votes = await ReplyVote.find({
        replyId: { $in: replyIds },
        userId,
      })

      votes.forEach((vote) => {
        const replyId = vote.replyId.toString()
        userVotes.set(replyId, vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote')
      })
    }

    // Transform replies
    const replies = replyDocs.map((doc: any) => {
      const userIdValue = doc.userId
      const userIdString = userIdValue?._id?.toString() || userIdValue?.toString() || ''
      const isUserIdPopulated = userIdValue && typeof userIdValue === 'object' && 'email' in userIdValue

      // Ensure links are properly formatted
      const replyLinks = Array.isArray(doc.links) 
        ? doc.links.filter((link: any) => link && typeof link === 'string' && link.trim().length > 0)
        : []

      return {
        id: doc._id.toString(),
        targetType: doc.targetType,
        targetId: doc.targetId.toString(),
        userId: userIdString,
        body: doc.body,
        links: replyLinks,
        upvotes: doc.upvotes || 0,
        downvotes: doc.downvotes || 0,
        score: doc.score || 0,
        status: doc.status?.toLowerCase() || 'approved',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        userVote: userVotes.get(doc._id.toString()) || null,
        user: isUserIdPopulated
          ? {
              id: userIdValue._id?.toString() || userIdString,
              email: userIdValue.email,
              username: userIdValue.username,
              firstName: userIdValue.firstName,
              lastName: userIdValue.lastName,
              avatarUrl: userIdValue.avatarUrl,
              role: userIdValue.role || 'user',
              createdAt: userIdValue.createdAt,
            }
          : undefined,
      }
    })

    return NextResponse.json(
      {
        success: true,
        replies,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch replies'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        replies: [],
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user
    await connectDB()

    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const validationResult = createReplySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { targetType, targetId, body: replyBody, links } = validationResult.data

    // Validate and normalize links (only 1 link allowed)
    let normalizedLinks: string[] = []
    if (links && Array.isArray(links) && links.length > 0) {
      // Only take the first link if multiple are provided
      const linkToProcess = links[0]
      
      if (linkToProcess && typeof linkToProcess === 'string') {
        const trimmed = linkToProcess.trim()
        if (trimmed) {
          // Add protocol if missing
          const linkWithProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
            ? trimmed
            : `https://${trimmed}`
          
          // Validate URL
          try {
            const url = new URL(linkWithProtocol)
            // Ensure the URL has a valid hostname
            if (!url.hostname || url.hostname.length === 0) {
              throw new Error('Invalid hostname')
            }
            normalizedLinks = [linkWithProtocol]
          } catch (error) {
            return NextResponse.json(
              {
                success: false,
                error: `Invalid URL format: ${trimmed}`,
              },
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }
        }
      }
      
      // Warn if more than 1 link was provided
      if (links.length > 1) {
        console.warn(`Multiple links provided, only the first link will be saved. Provided: ${links.length}, saving: 1`)
      }
    }

    // Validate targetId format
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid targetId format',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify target exists
    const targetIdObj = new mongoose.Types.ObjectId(targetId)
    const target = targetType === 'evidence'
      ? await Evidence.findById(targetIdObj)
          .populate('userId', 'username')
          .populate('claimId', 'title')
          .lean()
      : await Perspective.findById(targetIdObj)
          .populate('userId', 'username')
          .populate('claimId', 'title')
          .lean()

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: `${targetType} not found`,
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create reply
    const reply = await Reply.create({
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      userId: new mongoose.Types.ObjectId(user.userId),
      body: replyBody.trim(),
      links: normalizedLinks,
      status: ReplyStatus.APPROVED,
      upvotes: 0,
      downvotes: 0,
      score: 0,
    })

    // Populate reply with user data
    const populatedReply = await Reply.findById(reply._id)
      .populate('userId', 'username email firstName lastName avatarUrl role createdAt')
      .lean()

    if (!populatedReply) {
      throw new Error('Failed to retrieve created reply')
    }

    // Ensure links field is present (Mongoose should include it, but just in case)
    if (!(populatedReply as any).links || !Array.isArray((populatedReply as any).links)) {
      (populatedReply as any).links = normalizedLinks
    }

    // Notify target author (if not replying to own content)
    const targetUserId = target.userId instanceof mongoose.Types.ObjectId
      ? target.userId.toString()
      : (target.userId as any)?._id?.toString() || (target.userId as any).toString()

    const replyAuthorId = user.userId

    if (targetUserId && targetUserId !== replyAuthorId) {
      const targetTitle =
        targetType === 'evidence'
          ? (target as any).title || 'your evidence'
          : (target as any).title || 'your perspective'

      const claimTitle =
        target.claimId instanceof mongoose.Types.ObjectId
          ? 'a claim'
          : (target.claimId as any)?.title || 'a claim'

      const authorUsername = user.username || 'Someone'

      createNotification({
        userId: targetUserId,
        type: NotificationType.NEW_REPLY,
        title: 'New reply to your content',
        message: `@${authorUsername} replied to your ${targetType === 'evidence' ? 'evidence' : 'perspective'} "${targetTitle}" on "${claimTitle}"`,
        link: `/claims/${target.claimId instanceof mongoose.Types.ObjectId ? target.claimId.toString() : (target.claimId as any)?._id?.toString() || ''}`,
      }).catch((error) => {
        console.error('Error notifying target author about reply:', error)
      })
    }

    // Transform reply for response
    const userIdValue = populatedReply.userId
    const userIdString = userIdValue?._id?.toString() || userIdValue?.toString() || ''
    const isUserIdPopulated = userIdValue && typeof userIdValue === 'object' && 'email' in userIdValue

    // Ensure links are properly formatted - use normalizedLinks as fallback
    const replyLinks = Array.isArray((populatedReply as any).links) && (populatedReply as any).links.length > 0
      ? (populatedReply as any).links.filter((link: any) => link && typeof link === 'string' && link.trim().length > 0)
      : normalizedLinks.length > 0 
        ? normalizedLinks 
        : []

    return NextResponse.json(
      {
        success: true,
        reply: {
          id: populatedReply._id.toString(),
          targetType: populatedReply.targetType,
          targetId: populatedReply.targetId.toString(),
          userId: userIdString,
          body: populatedReply.body,
          links: replyLinks,
          upvotes: populatedReply.upvotes || 0,
          downvotes: populatedReply.downvotes || 0,
          score: populatedReply.score || 0,
          status: populatedReply.status?.toLowerCase() || 'approved',
          createdAt: populatedReply.createdAt,
          updatedAt: populatedReply.updatedAt,
          userVote: null,
          user: isUserIdPopulated
            ? {
                id: userIdValue._id?.toString() || userIdString,
                email: (userIdValue as any).email,
                username: (userIdValue as any).username,
                firstName: (userIdValue as any).firstName,
                lastName: (userIdValue as any).lastName,
                avatarUrl: (userIdValue as any).avatarUrl,
                role: (userIdValue as any).role || 'user',
                createdAt: (userIdValue as any).createdAt,
              }
            : undefined,
        },
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create reply'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}


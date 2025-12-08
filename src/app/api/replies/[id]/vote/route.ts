import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Reply } from '@/lib/db/models'
import { ReplyVote } from '@/lib/db/models'
import { VoteType } from '@/lib/db/models'
import { NotificationType } from '@/lib/db/models'
import { createNotification } from '@/lib/utils/notifications'
import mongoose from 'mongoose'
import { z } from 'zod'

const voteSchema = z.object({
  voteType: z.enum(['upvote', 'downvote']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user
    const replyId = params.id

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(replyId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reply ID format',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
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
          error: 'Invalid JSON in request body',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const validationResult = voteSchema.safeParse(body)
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

    const { voteType } = validationResult.data

    // Find the reply
    const reply = await Reply.findById(new mongoose.Types.ObjectId(replyId))
      .populate('userId', 'username')
      .lean()

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reply not found',
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = new mongoose.Types.ObjectId(user.userId)
    const replyObjectId = new mongoose.Types.ObjectId(replyId)

    // Check if user already voted
    const existingVote = await ReplyVote.findOne({
      replyId: replyObjectId,
      userId,
    })

    const voteTypeEnum = voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE

    // Get current reply document (not lean) to update
    const replyDoc = await Reply.findById(replyObjectId)
    if (!replyDoc) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reply not found',
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (existingVote) {
      // User already voted - update or remove vote
      if (existingVote.voteType === voteTypeEnum) {
        // Same vote type - remove the vote
        await ReplyVote.findByIdAndDelete(existingVote._id)

        // Update vote counts
        if (voteType === 'upvote') {
          replyDoc.upvotes = Math.max(0, replyDoc.upvotes - 1)
        } else {
          replyDoc.downvotes = Math.max(0, replyDoc.downvotes - 1)
        }
      } else {
        // Different vote type - update the vote
        const oldVoteType = existingVote.voteType

        // Decrement old vote count
        if (oldVoteType === VoteType.UPVOTE) {
          replyDoc.upvotes = Math.max(0, replyDoc.upvotes - 1)
        } else {
          replyDoc.downvotes = Math.max(0, replyDoc.downvotes - 1)
        }

        // Increment new vote count
        if (voteType === 'upvote') {
          replyDoc.upvotes += 1
        } else {
          replyDoc.downvotes += 1
        }

        // Update vote
        existingVote.voteType = voteTypeEnum
        await existingVote.save()
      }
    } else {
      // New vote
      await ReplyVote.create({
        replyId: replyObjectId,
        userId,
        voteType: voteTypeEnum,
      })

      // Update vote counts
      if (voteType === 'upvote') {
        replyDoc.upvotes += 1
      } else {
        replyDoc.downvotes += 1
      }
    }

    // Update score (upvotes - downvotes)
    replyDoc.score = replyDoc.upvotes - replyDoc.downvotes
    await replyDoc.save()

    // Notify reply owner about vote (only if it's a new vote and not their own reply)
    const replyOwnerId = reply.userId instanceof mongoose.Types.ObjectId
      ? reply.userId.toString()
      : (reply.userId as any)?._id?.toString() || (reply.userId as any).toString()

    const voterId = user.userId

    // Only notify if it's a new vote and the voter is not the reply owner
    if (!existingVote && replyOwnerId !== voterId) {
      const replyBody = reply.body || 'your reply'
      const voterUsername = user.username || 'Someone'

      createNotification({
        userId: replyOwnerId,
        type: NotificationType.VOTE_RECEIVED,
        title: `Your reply received a ${voteType === 'upvote' ? 'Yes' : 'No'} vote`,
        message: `@${voterUsername} ${voteType === 'upvote' ? 'upvoted' : 'downvoted'} your reply`,
        link: '', // Could add link to the claim/evidence/perspective
      }).catch((error) => {
        console.error('Error notifying reply owner about vote:', error)
      })
    }

    // Get updated vote status
    const currentVote = await ReplyVote.findOne({
      replyId: replyObjectId,
      userId,
    })

    return NextResponse.json(
      {
        success: true,
        reply: {
          id: replyDoc._id.toString(),
          upvotes: replyDoc.upvotes,
          downvotes: replyDoc.downvotes,
          score: replyDoc.score,
        },
        userVote: currentVote ? (currentVote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote') : null,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on reply'

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


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth, optionalAuth } from '@/lib/auth/middleware'
import { Claim, Category, ClaimStatus } from '@/lib/db/models'
import { ClaimVote, VoteType } from '@/lib/db/models'
import { generateClaimSummary, generateSEOMetadata } from '@/lib/ai/summarize'
import { notifyAdmins } from '@/lib/utils/notifications'
import { NotificationType } from '@/lib/db/models'
import mongoose from 'mongoose'
import { z } from 'zod'

const createClaimSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().max(5000).optional(),
  category: z.string().optional(),
  evidenceType: z.enum(['url', 'youtube', 'tweet', 'file']).optional(),
  evidenceUrl: z.string().optional(),
  evidenceDescription: z.string().max(500).optional(),
  position: z.enum(['for', 'against']).optional(),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  expeditedReview: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const upvotedBy = searchParams.get('upvotedBy')
    
    let authResult: { user: { userId: string } } | null = null
    if (status !== 'approved' || userId || upvotedBy) {
      const authCheck = await requireAuth(request)
      if (authCheck.error) {
        return authCheck.error
      }
      authResult = authCheck
    }
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (upvotedBy === 'me') {
      if (!authResult) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentication required',
            claims: [],
            total: 0,
            hasMore: false,
          },
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId)
      
      const upvotes = await ClaimVote.find({
        userId: currentUserId,
        voteType: VoteType.UPVOTE,
      }).lean()
      
      const upvotedClaimIds = upvotes.map((vote: any) => vote.claimId)
      
      if (upvotedClaimIds.length === 0) {
        return NextResponse.json({
          success: true,
          claims: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }
      
      const query: any = {
        _id: { $in: upvotedClaimIds },
        userId: { $ne: currentUserId },
      }
      
      if (status) {
        query.status = status.toUpperCase()
      } else {
        query.status = ClaimStatus.APPROVED
      }
      
      if (category) {
        const categoryDoc = await Category.findOne({ slug: category.toLowerCase() })
        if (categoryDoc) {
          query.categoryId = categoryDoc._id
        }
      }
      
      if (search) {
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ]
          }
        ]
      }
      
      let sort: any = { createdAt: -1 } 
      if (sortBy === 'popular') {
        sort = { viewCount: -1 }
      } else if (sortBy === 'trending') {
        sort = { viewCount: -1, createdAt: -1 }
      } else if (sortBy === 'newest') {
        sort = { createdAt: -1 }
      } else if (sortBy === 'most-voted') {
        sort = { upvotes: -1, createdAt: -1 }
      } else if (sortBy === 'most-viewed') {
        sort = { viewCount: -1 }
      } else if (sortBy === 'most-followed') {
        sort = { followCount: -1, createdAt: -1 }
      } else if (sortBy === 'oldest') {
        sort = { createdAt: 1 }
      }
      
      const claims = await Claim.find(query)
        .populate('userId', 'username email firstName lastName avatarUrl')
        .populate('categoryId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
      
      const total = await Claim.countDocuments(query)
      const claimIds = claims.map((claim: any) => new mongoose.Types.ObjectId(claim._id))
      const votes = await ClaimVote.find({
        claimId: { $in: claimIds },
        userId: currentUserId,
      })
      const userVotes: Map<string, 'upvote' | 'downvote'> = new Map()
      votes.forEach((vote) => {
        const claimId = vote.claimId.toString()
        userVotes.set(claimId, vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote')
      })
      
      const transformedClaims = claims.map((claim: any) => {
        const claimUserId = claim.userId instanceof mongoose.Types.ObjectId 
          ? claim.userId.toString() 
          : (claim.userId?._id?.toString() || claim.userId?.toString() || claim.userId)
        
        const categoryIdString = claim.categoryId 
          ? (claim.categoryId instanceof mongoose.Types.ObjectId 
              ? claim.categoryId.toString() 
              : (claim.categoryId?._id?.toString() || claim.categoryId?.toString()))
          : undefined

        return {
          id: claim._id.toString(),
          userId: claimUserId,
          title: claim.title,
          description: claim.description,
          categoryId: categoryIdString,
          status: claim.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
          forSummary: claim.forSummary,
          summaryUpdatedAt: claim.summaryUpdatedAt,
          viewCount: claim.viewCount,
          followCount: claim.followCount || 0,
          totalScore: claim.totalScore || 0,
          upvotes: claim.upvotes || 0,
          downvotes: claim.downvotes || 0,
          userVote: userVotes.get(claim._id.toString()) || null,
          url: claim.url,
          fileUrl: claim.fileUrl,
          fileName: claim.fileName,
          fileSize: claim.fileSize,
          fileType: claim.fileType,
          seoTitle: claim.seoTitle,
          seoDescription: claim.seoDescription,
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt,
          user: claim.userId && !(claim.userId instanceof mongoose.Types.ObjectId) ? {
            id: claim.userId._id?.toString() || claimUserId,
            email: claim.userId.email,
            username: claim.userId.username,
            firstName: claim.userId.firstName,
            lastName: claim.userId.lastName,
            avatarUrl: claim.userId.avatarUrl,
            role: claim.userId.role || 'user',
            createdAt: claim.userId.createdAt,
          } : undefined,
          category: claim.categoryId && !(claim.categoryId instanceof mongoose.Types.ObjectId) ? {
            id: claim.categoryId._id?.toString() || categoryIdString,
            name: claim.categoryId.name,
            slug: claim.categoryId.slug,
            description: claim.categoryId.description,
          } : undefined,
        }
      })

      return NextResponse.json({
        success: true,
        claims: transformedClaims,
        total,
        page,
        limit,
        hasMore: skip + transformedClaims.length < total,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    const query: any = {}
    
    if (status) {
      query.status = status.toUpperCase()
    }
    
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = new mongoose.Types.ObjectId(userId)
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid userId format',
            claims: [],
            total: 0,
            hasMore: false,
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category.toLowerCase() })
      if (categoryDoc) {
        query.categoryId = categoryDoc._id
      }
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    let sort: any = { createdAt: -1 }
    if (sortBy === 'popular') {
      sort = { viewCount: -1 }
    } else if (sortBy === 'trending') {
      sort = { viewCount: -1, createdAt: -1 }
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1 }
    } else if (sortBy === 'most-voted') {
      sort = { upvotes: -1, createdAt: -1 }
    } else if (sortBy === 'most-viewed') {
      sort = { viewCount: -1 }
    } else if (sortBy === 'most-followed') {
      sort = { followCount: -1, createdAt: -1 }
    } else if (sortBy === 'oldest') {
      sort = { createdAt: 1 }
    }

    const claims = await Claim.find(query)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Claim.countDocuments(query)

    const user = await optionalAuth(request)
    let userVotes: Map<string, 'upvote' | 'downvote'> = new Map()
    
    if (user) {
      const userId = new mongoose.Types.ObjectId(user.userId)
      const claimIds = claims.map((claim: any) => new mongoose.Types.ObjectId(claim._id))
      
      const votes = await ClaimVote.find({
        claimId: { $in: claimIds },
        userId,
      })
      votes.forEach((vote) => {
        const claimId = vote.claimId.toString()
        userVotes.set(claimId, vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote')
      })
    }

    const isAdmin = user && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'MODERATOR')
    const currentUserId = user?.userId
    const transformedClaims = claims.map((claim: any) => {
      const userId = claim.userId instanceof mongoose.Types.ObjectId 
        ? claim.userId.toString() 
        : (claim.userId?._id?.toString() || claim.userId?.toString() || claim.userId)
      
      const categoryIdString = claim.categoryId 
        ? (claim.categoryId instanceof mongoose.Types.ObjectId 
            ? claim.categoryId.toString() 
            : (claim.categoryId?._id?.toString() || claim.categoryId?.toString()))
        : undefined

      const isCreator = currentUserId && userId === currentUserId
      const canSeeEditFields = isAdmin || isCreator

      const claimResponse: any = {
        id: claim._id.toString(),
        userId,
        title: claim.title,
        description: claim.description,
        categoryId: categoryIdString,
        status: claim.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
        forSummary: claim.forSummary,
        summaryUpdatedAt: claim.summaryUpdatedAt,
        viewCount: claim.viewCount,
        followCount: claim.followCount || 0,
        totalScore: claim.totalScore || 0,
        upvotes: claim.upvotes || 0,
        downvotes: claim.downvotes || 0,
        userVote: userVotes.get(claim._id.toString()) || null,
        url: claim.url,
        fileUrl: claim.fileUrl,
        fileName: claim.fileName,
        fileSize: claim.fileSize,
        fileType: claim.fileType,
        seoTitle: claim.seoTitle,
        seoDescription: claim.seoDescription,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        user: claim.userId && !(claim.userId instanceof mongoose.Types.ObjectId) ? {
          id: claim.userId._id?.toString() || userId,
          email: claim.userId.email,
          username: claim.userId.username,
          firstName: claim.userId.firstName,
          lastName: claim.userId.lastName,
          avatarUrl: claim.userId.avatarUrl,
          role: claim.userId.role || 'user',
          createdAt: claim.userId.createdAt,
        } : undefined,
        category: claim.categoryId && !(claim.categoryId instanceof mongoose.Types.ObjectId) ? {
          id: claim.categoryId._id?.toString() || categoryIdString,
          name: claim.categoryId.name,
          slug: claim.categoryId.slug,
          description: claim.categoryId.description,
        } : undefined,
      }

      if (canSeeEditFields) {
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

      return claimResponse
    })

    return NextResponse.json({
      success: true,
      claims: transformedClaims,
      total,
      page,
      limit,
      hasMore: skip + transformedClaims.length < total,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claims'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        claims: [],
        total: 0,
        hasMore: false,
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
          error: 'Invalid JSON in request body' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const validationResult = createClaimSchema.safeParse(body)
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

    const { title, description, category, evidenceType, evidenceUrl, evidenceDescription, position, url, fileUrl, fileName, fileSize, fileType, expeditedReview } = validationResult.data

    let categoryId: mongoose.Types.ObjectId | undefined
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category.toLowerCase() })
      if (categoryDoc && categoryDoc._id) {
        categoryId = categoryDoc._id as unknown as mongoose.Types.ObjectId
      }
    }

    const claim = await Claim.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      title,
      originalTitle: title,
      description,
      categoryId,
      status: ClaimStatus.PENDING,
      viewCount: 0,
      url,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      titleEdited: false,
      expeditedReview: expeditedReview || false,
    })

    if (expeditedReview) {
      notifyAdmins({
        type: NotificationType.EXPEDITED_REVIEW_REQUESTED,
        title: 'Expedited review requested',
        message: `"${title}" has been submitted with an expedited review request`,
        link: `/moderation?claimId=${claim._id.toString()}`,
      }).catch((error) => {
        console.error('Error notifying admins about expedited review request:', error)
      })
    } else {
      notifyAdmins({
        type: NotificationType.CLAIM_SUBMITTED,
        title: 'New claim submitted for review',
        message: `"${title}" has been submitted and is pending approval`,
        link: `/moderation?claimId=${claim._id.toString()}`,
      }).catch((error) => {
        console.error('Error notifying admins about claim submission:', error)
      })
    }

    await claim.populate('userId', 'username email firstName lastName avatarUrl')
    await claim.populate('categoryId', 'name slug')

    const categoryName = claim.categoryId && !(claim.categoryId instanceof mongoose.Types.ObjectId)
      ? (claim.categoryId as any).name
      : undefined
    
    generateSEOMetadata({
      claimTitle: title,
      claimCategory: categoryName,
      leadingSide: null,
    })
      .then(async (seoMetadata) => {
        try {
          await Claim.findByIdAndUpdate(claim._id, {
            seoTitle: seoMetadata.seoTitle,
            seoDescription: seoMetadata.seoDescription,
          })
        } catch (dbError) {
          console.error('Error saving SEO metadata to database:', dbError)
        }
      })
      .catch((error) => {
        console.warn('SEO metadata generation completed with fallback or error:', error?.message || 'Unknown error')
      })

    if (process.env.OPENAI_API_KEY && (url || fileUrl)) {
      generateClaimSummary({
        title,
        description,
        url,
        fileUrl,
        fileName,
        fileType,
      })
        .then(async (summary) => {
          try {
            await Claim.findByIdAndUpdate(claim._id, {
              forSummary: summary,
              summaryUpdatedAt: new Date(),
            })
          } catch (dbError) {
            console.error('Error saving claim summary to database:', dbError)
          }
        })
        .catch((error) => {
          console.warn('Claim summary generation completed with fallback or error:', error?.message || 'Unknown error')
        })
    }

    const populatedClaim = await Claim.findById(claim._id)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('categoryId', 'name slug')

    if (!populatedClaim) {
      throw new Error('Failed to retrieve created claim')
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
        forSummary: populatedClaim.forSummary,
        summaryUpdatedAt: populatedClaim.summaryUpdatedAt,
        viewCount: populatedClaim.viewCount,
        url: populatedClaim.url,
        fileUrl: populatedClaim.fileUrl,
        fileName: populatedClaim.fileName,
        fileSize: populatedClaim.fileSize,
        fileType: populatedClaim.fileType,
        seoTitle: populatedClaim.seoTitle,
        seoDescription: populatedClaim.seoDescription,
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
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create claim'
    
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


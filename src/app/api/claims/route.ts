import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth, optionalAuth } from '@/lib/auth/middleware'
import { Claim, Category, ClaimStatus } from '@/lib/db/models'
import { ClaimVote, VoteType } from '@/lib/db/models'
import { Evidence, EvidenceType, Position, EvidenceStatus } from '@/lib/db/models'
import { Flag } from '@/lib/db/models'
import { uploadFile } from '@/lib/storage/upload'
import { fetchOEmbed } from '@/lib/oembed/client'
import { updateClaimScore } from '@/lib/utils/claimScore'
import { generateClaimSummary, generateEvidenceSummary } from '@/lib/ai/summarize'
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
})

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    // Allow public access to approved claims, require auth for others
    // Also require auth when filtering by userId (user's own claims)
    if (status !== 'approved' || userId) {
      const authResult = await requireAuth(request)
      if (authResult.error) {
        return authResult.error
      }
    }
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    
    if (status) {
      query.status = status.toUpperCase()
    }
    
    if (userId) {
      // Validate userId format
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

    // Build sort
    let sort: any = { createdAt: -1 } // Default: newest first
    if (sortBy === 'popular') {
      sort = { viewCount: -1 }
    } else if (sortBy === 'trending') {
      sort = { viewCount: -1, createdAt: -1 }
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1 }
    }

    // Fetch claims
    const claims = await Claim.find(query)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await Claim.countDocuments(query)

    // Get user vote status if authenticated
    const user = await optionalAuth(request)
    let userVotes: Map<string, 'upvote' | 'downvote'> = new Map()
    
    if (user) {
      const userId = new mongoose.Types.ObjectId(user.userId)
      const claimIds = claims.map((claim: any) => new mongoose.Types.ObjectId(claim._id))
      
      // Get all votes
      const votes = await ClaimVote.find({
        claimId: { $in: claimIds },
        userId,
      })
      votes.forEach((vote) => {
        const claimId = vote.claimId.toString()
        userVotes.set(claimId, vote.voteType === VoteType.UPVOTE ? 'upvote' : 'downvote')
      })
    }

    // Transform claims to match frontend format
    const transformedClaims = claims.map((claim: any) => {
      const userId = claim.userId instanceof mongoose.Types.ObjectId 
        ? claim.userId.toString() 
        : (claim.userId?._id?.toString() || claim.userId?.toString() || claim.userId)
      
      const categoryIdString = claim.categoryId 
        ? (claim.categoryId instanceof mongoose.Types.ObjectId 
            ? claim.categoryId.toString() 
            : (claim.categoryId?._id?.toString() || claim.categoryId?.toString()))
        : undefined

      return {
        id: claim._id.toString(),
        userId,
        title: claim.title,
        description: claim.description,
        categoryId: categoryIdString,
        status: claim.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
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
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Ensure database connection
    await connectDB()

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

    const { title, description, category, evidenceType, evidenceUrl, evidenceDescription, position, url, fileUrl, fileName, fileSize, fileType } = validationResult.data

    // Find or create category if provided
    let categoryId: mongoose.Types.ObjectId | undefined
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category.toLowerCase() })
      if (categoryDoc && categoryDoc._id) {
        categoryId = categoryDoc._id as unknown as mongoose.Types.ObjectId
      }
    }

    // Create claim
    const claim = await Claim.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      title,
      description,
      categoryId,
      status: ClaimStatus.PENDING,
      viewCount: 0,
      url,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    })

    // Handle initial evidence if provided
    if (evidenceType && (evidenceUrl || body.fileUrl)) {
      let evidenceData: any = {
        claimId: claim._id,
        userId: new mongoose.Types.ObjectId(user.userId),
        position: position ? (position.toUpperCase() as Position) : Position.FOR,
        description: evidenceDescription,
        status: EvidenceStatus.APPROVED, // Auto-approve evidence
        upvotes: 0,
        downvotes: 0,
        score: 0,
      }

      // Handle file-based evidence
      if (evidenceType === 'file' && body.fileUrl) {
        evidenceData.type = EvidenceType.FILE
        evidenceData.fileUrl = body.fileUrl
        evidenceData.fileName = body.fileName
        evidenceData.fileSize = body.fileSize
        evidenceData.fileType = body.fileType
      } else if (evidenceType !== 'file' && evidenceUrl) {
        // Handle URL-based evidence
        let evidenceTypeEnum: EvidenceType
        let metadata: Record<string, any> | undefined

        // Determine evidence type from URL
        if (evidenceUrl.includes('youtube.com') || evidenceUrl.includes('youtu.be')) {
          evidenceTypeEnum = EvidenceType.YOUTUBE
          try {
            const oembedData = await fetchOEmbed(evidenceUrl)
            metadata = {
              title: oembedData.title,
              thumbnail: oembedData.thumbnail,
              provider: oembedData.provider,
            }
            evidenceData.title = oembedData.title || undefined
          } catch (error) {
          }
        } else if (evidenceUrl.includes('twitter.com') || evidenceUrl.includes('x.com')) {
          evidenceTypeEnum = EvidenceType.TWEET
          try {
            const oembedData = await fetchOEmbed(evidenceUrl)
            metadata = {
              title: oembedData.title,
              provider: oembedData.provider,
            }
            evidenceData.title = oembedData.title || undefined
          } catch (error) {
            console.error('Failed to fetch oEmbed data:', error)
          }
        } else if (evidenceUrl.includes('tiktok.com')) {
          evidenceTypeEnum = EvidenceType.TIKTOK
          try {
            const oembedData = await fetchOEmbed(evidenceUrl)
            metadata = {
              title: oembedData.title,
              provider: oembedData.provider,
            }
            evidenceData.title = oembedData.title || undefined
          } catch (error) {
            console.error('Failed to fetch oEmbed data:', error)
          }
        } else if (evidenceUrl.includes('instagram.com')) {
          evidenceTypeEnum = EvidenceType.INSTAGRAM
          try {
            const oembedData = await fetchOEmbed(evidenceUrl)
            metadata = {
              title: oembedData.title,
              provider: oembedData.provider,
            }
            evidenceData.title = oembedData.title || undefined
          } catch (error) {
            console.error('Failed to fetch oEmbed data:', error)
          }
        } else {
          evidenceTypeEnum = EvidenceType.URL
          try {
            const oembedData = await fetchOEmbed(evidenceUrl)
            metadata = {
              title: oembedData.title,
              description: oembedData.description,
              thumbnail: oembedData.thumbnail,
              provider: oembedData.provider,
            }
            evidenceData.title = oembedData.title || undefined
          } catch (error) {
            console.error('Failed to fetch oEmbed data:', error)
          }
        }

        evidenceData.type = evidenceTypeEnum
        evidenceData.url = evidenceUrl
        evidenceData.metadata = metadata
      }

      // Create evidence if we have valid data
      if (evidenceData.type) {
        const createdEvidence = await Evidence.create(evidenceData)
        
        // Update claim score since evidence is auto-approved
        try {
          await updateClaimScore(claim._id)
        } catch (error) {
          console.error('Error updating claim score after evidence creation:', error)
          // Don't fail the request if score update fails
        }

        // Generate AI summary for evidence (async, non-blocking)
        if (process.env.OPENAI_API_KEY) {
          generateEvidenceSummary({
            type: evidenceData.type.toLowerCase() as 'url' | 'file' | 'youtube' | 'tiktok' | 'instagram' | 'tweet' | 'text',
            title: evidenceData.title,
            description: evidenceData.description,
            url: evidenceData.url,
            fileUrl: evidenceData.fileUrl,
            fileName: evidenceData.fileName,
            fileType: evidenceData.fileType,
            position: evidenceData.position.toLowerCase() as 'for' | 'against',
            claimTitle: title,
          })
            .then(async (summary) => {
              try {
                await Evidence.findByIdAndUpdate(createdEvidence._id, {
                  aiSummary: summary,
                  summaryUpdatedAt: new Date(),
                })
              } catch (dbError) {
                console.error('Error saving evidence summary to database:', dbError)
              }
            })
            .catch((error) => {
              console.warn('Evidence summary generation completed with fallback or error:', error?.message || 'Unknown error')
            })
        }
      }
    }

    // Generate AI summary for claim (async, non-blocking)
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
            // For now, we'll store it in forSummary if it's a general summary
            // You might want to adjust this based on your needs
            await Claim.findByIdAndUpdate(claim._id, {
              forSummary: summary,
              summaryUpdatedAt: new Date(),
            })
          } catch (dbError) {
            console.error('Error saving claim summary to database:', dbError)
          }
        })
        .catch((error) => {
          // Error is already handled in generateClaimSummary, just log here
          console.warn('Claim summary generation completed with fallback or error:', error?.message || 'Unknown error')
        })
    }

    // Populate claim with user and category
    await claim.populate('userId', 'username email firstName lastName avatarUrl')
    await claim.populate('categoryId', 'name slug')

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
        viewCount: populatedClaim.viewCount,
        url: populatedClaim.url,
        fileUrl: populatedClaim.fileUrl,
        fileName: populatedClaim.fileName,
        fileSize: populatedClaim.fileSize,
        fileType: populatedClaim.fileType,
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
    
    // Always return JSON, even on errors
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


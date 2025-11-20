import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Claim } from '@/lib/db/models'
import { Evidence, EvidenceType, Position, EvidenceStatus } from '@/lib/db/models'
import { fetchOEmbed } from '@/lib/oembed/client'
import { updateClaimScore } from '@/lib/utils/claimScore'
import { generateEvidenceSummary } from '@/lib/ai/summarize'
import mongoose from 'mongoose'
import { z } from 'zod'

const createEvidenceSchema = z.object({
  type: z.enum(['url', 'file']),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  position: z.enum(['for', 'against']),
})

export async function POST(request: NextRequest) {
  try {
    // Get claimId from query parameters
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('id')
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Ensure database connection
    await connectDB()

    // Check if claimId exists
    if (!claimId) {
      return NextResponse.json(
        { success: false, error: 'Claim ID is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate claim ID format
    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid claim ID format', receivedId: claimId },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate claim exists
    const claim = await Claim.findById(new mongoose.Types.ObjectId(claimId))
    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { 
          status: 404,
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
    const validationResult = createEvidenceSchema.safeParse(body)
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

    const { type, url, fileUrl, fileName, fileSize, fileType, title, description, position } = validationResult.data

    // Validate that required fields are provided based on type
    if (type === 'url') {
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'URL is required for URL type evidence' },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      // Validate URL format
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL format' },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } else if (type === 'file') {
      if (!fileUrl) {
        return NextResponse.json(
          { success: false, error: 'File URL is required for file type evidence' },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Prepare evidence data
    const evidenceData: any = {
      claimId: new mongoose.Types.ObjectId(claimId),
      userId: new mongoose.Types.ObjectId(user.userId),
      position: position.toUpperCase() as Position,
      title: title?.trim() || undefined,
      description,
      status: EvidenceStatus.APPROVED, // Auto-approve evidence
      upvotes: 0,
      downvotes: 0,
      score: 0,
    }

    // Handle URL-based evidence
    if (type === 'url' && url) {
      let evidenceTypeEnum: EvidenceType
      let metadata: Record<string, any> | undefined

      // Determine evidence type from URL
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        evidenceTypeEnum = EvidenceType.YOUTUBE
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            thumbnail: oembedData.thumbnail,
            provider: oembedData.provider,
          }
          // Only set title from oEmbed if user didn't provide one
          if (!title?.trim()) {
            evidenceData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        evidenceTypeEnum = EvidenceType.TWEET
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          // Only set title from oEmbed if user didn't provide one
          if (!title?.trim()) {
            evidenceData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('tiktok.com')) {
        evidenceTypeEnum = EvidenceType.TIKTOK
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          // Only set title from oEmbed if user didn't provide one
          if (!title?.trim()) {
            evidenceData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else if (url.includes('instagram.com')) {
        evidenceTypeEnum = EvidenceType.INSTAGRAM
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            provider: oembedData.provider,
          }
          // Only set title from oEmbed if user didn't provide one
          if (!title?.trim()) {
            evidenceData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      } else {
        evidenceTypeEnum = EvidenceType.URL
        try {
          const oembedData = await fetchOEmbed(url)
          metadata = {
            title: oembedData.title,
            description: oembedData.description,
            thumbnail: oembedData.thumbnail,
            provider: oembedData.provider,
          }
          // Only set title from oEmbed if user didn't provide one
          if (!title?.trim()) {
            evidenceData.title = oembedData.title || undefined
          }
        } catch (error) {
          console.error('Failed to fetch oEmbed data:', error)
        }
      }

      evidenceData.type = evidenceTypeEnum
      evidenceData.url = url
      evidenceData.metadata = metadata
    } else if (type === 'file' && fileUrl) {
      // Handle file-based evidence
      evidenceData.type = EvidenceType.FILE
      evidenceData.fileUrl = fileUrl
      evidenceData.fileName = fileName
      evidenceData.fileSize = fileSize
      evidenceData.fileType = fileType
    }

    // Ensure type is set before creating
    if (!evidenceData.type) {
      return NextResponse.json(
        { success: false, error: 'Evidence type is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create evidence
    const evidence = await Evidence.create(evidenceData)

    // Update claim score since evidence is auto-approved
    // The score will include this new evidence immediately
    try {
      await updateClaimScore(new mongoose.Types.ObjectId(claimId))
    } catch (error) {
      console.error('Error updating claim score after evidence creation:', error)
      // Don't fail the request if score update fails
    }

    // Generate AI summary for evidence (async, non-blocking)
    if (process.env.OPENAI_API_KEY) {
      // Determine evidence type for summary generation
      let evidenceTypeForSummary: 'url' | 'file' | 'youtube' | 'tiktok' | 'instagram' | 'tweet' | 'text' = 'text'
      
      if (evidenceData.type === EvidenceType.URL) {
        evidenceTypeForSummary = 'url'
      } else if (evidenceData.type === EvidenceType.FILE) {
        evidenceTypeForSummary = 'file'
      } else if (evidenceData.type === EvidenceType.YOUTUBE) {
        evidenceTypeForSummary = 'youtube'
      } else if (evidenceData.type === EvidenceType.TIKTOK) {
        evidenceTypeForSummary = 'tiktok'
      } else if (evidenceData.type === EvidenceType.INSTAGRAM) {
        evidenceTypeForSummary = 'instagram'
      } else if (evidenceData.type === EvidenceType.TWEET) {
        evidenceTypeForSummary = 'tweet'
      }

      generateEvidenceSummary({
        type: evidenceTypeForSummary,
        title: evidenceData.title,
        description: evidenceData.description,
        url: evidenceData.url,
        fileUrl: evidenceData.fileUrl,
        fileName: evidenceData.fileName,
        fileType: evidenceData.fileType,
        position: evidenceData.position.toLowerCase() as 'for' | 'against',
        claimTitle: claim.title,
      })
        .then(async (summary) => {
          try {
            await Evidence.findByIdAndUpdate(evidence._id, {
              aiSummary: summary,
              summaryUpdatedAt: new Date(),
            })
          } catch (dbError) {
            console.error('Error saving evidence summary to database:', dbError)
          }
        })
        .catch((error) => {
          // Error is already handled in generateEvidenceSummary, just log here
          console.warn('Evidence summary generation completed with fallback or error:', error?.message || 'Unknown error')
        })
    }

    // Populate evidence with user and claim
    const populatedEvidence = await Evidence.findById(evidence._id)
      .populate('userId', 'username email firstName lastName avatarUrl')
      .populate('claimId', 'title description')

    if (!populatedEvidence) {
      throw new Error('Failed to retrieve created evidence')
    }

    // Get updated claim with recalculated score
    const updatedClaim = await Claim.findById(claimId)

    const evidenceClaimId = populatedEvidence.claimId instanceof mongoose.Types.ObjectId 
      ? populatedEvidence.claimId.toString() 
      : (populatedEvidence.claimId as any)?._id?.toString() || (populatedEvidence.claimId as any).toString()
    
    const evidenceUserId = populatedEvidence.userId instanceof mongoose.Types.ObjectId 
      ? populatedEvidence.userId.toString() 
      : (populatedEvidence.userId as any)?._id?.toString() || (populatedEvidence.userId as any).toString()

    return NextResponse.json({
      success: true,
      evidence: {
        id: populatedEvidence._id.toString(),
        claimId: evidenceClaimId,
        userId: evidenceUserId,
        type: populatedEvidence.type.toLowerCase() as 'url' | 'file' | 'tweet' | 'youtube' | 'tiktok' | 'instagram' | 'text',
        position: populatedEvidence.position.toLowerCase() as 'for' | 'against',
        title: populatedEvidence.title,
        description: populatedEvidence.description,
        url: populatedEvidence.url,
        fileUrl: populatedEvidence.fileUrl,
        fileName: populatedEvidence.fileName,
        fileSize: populatedEvidence.fileSize,
        fileType: populatedEvidence.fileType,
        metadata: populatedEvidence.metadata,
        status: populatedEvidence.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'flagged',
        upvotes: populatedEvidence.upvotes,
        downvotes: populatedEvidence.downvotes,
        score: populatedEvidence.score,
        createdAt: populatedEvidence.createdAt,
        updatedAt: populatedEvidence.updatedAt,
        user: populatedEvidence.userId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (populatedEvidence.userId as any)._id?.toString() || evidenceUserId,
          email: (populatedEvidence.userId as any).email,
          username: (populatedEvidence.userId as any).username,
          firstName: (populatedEvidence.userId as any).firstName,
          lastName: (populatedEvidence.userId as any).lastName,
          avatarUrl: (populatedEvidence.userId as any).avatarUrl,
          role: (populatedEvidence.userId as any).role || 'user',
          createdAt: (populatedEvidence.userId as any).createdAt,
        },
        claim: populatedEvidence.claimId instanceof mongoose.Types.ObjectId ? undefined : {
          id: (populatedEvidence.claimId as any)._id?.toString() || evidenceClaimId,
          title: (populatedEvidence.claimId as any).title,
          description: (populatedEvidence.claimId as any).description,
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create evidence'
    
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


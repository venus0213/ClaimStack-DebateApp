import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Evidence } from '@/lib/db/models'
import { Vote } from '@/lib/db/models'
import { EvidenceFollow } from '@/lib/db/models'
import { Claim } from '@/lib/db/models'
import { updateClaimScore } from '@/lib/utils/claimScore'
import { deleteFile } from '@/lib/storage/upload'
import mongoose from 'mongoose'

export async function DELETE(
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
    const evidenceId = params.id

    // Ensure database connection
    await connectDB()

    // Validate evidence ID format
    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid evidence ID format' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Find the evidence
    const evidence = await Evidence.findById(new mongoose.Types.ObjectId(evidenceId))
    if (!evidence) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Evidence not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user owns the evidence or is an admin
    const userRole = user.role?.toUpperCase()
    const isAdmin = userRole === 'ADMIN'
    
    const evidenceUserId = evidence.userId instanceof mongoose.Types.ObjectId
      ? evidence.userId.toString()
      : (evidence.userId as any)?._id?.toString() || (evidence.userId as any).toString()
    
    if (evidenceUserId !== user.userId && !isAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'You can only delete your own evidence' 
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const claimId = evidence.claimId

    // Delete associated file if exists
    if (evidence.fileUrl) {
      try {
        await deleteFile(evidence.fileUrl)
      } catch (error) {
        console.error('Error deleting evidence file:', error)
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete related data
    await Vote.deleteMany({ evidenceId: evidence._id })
    await EvidenceFollow.deleteMany({ evidenceId: evidence._id })
    await evidence.deleteOne()

    // Update claim score after deleting evidence
    if (claimId) {
      try {
        await updateClaimScore(claimId)
      } catch (error) {
        console.error('Error updating claim score after evidence deletion:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evidence deleted successfully',
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete evidence'
    
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


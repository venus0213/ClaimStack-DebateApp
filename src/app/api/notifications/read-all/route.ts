import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Notification } from '@/lib/db/models'
import mongoose from 'mongoose'

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Ensure database connection
    await connectDB()

    const userId = new mongoose.Types.ObjectId(user.userId)

    // Mark all notifications as read for the user
    const result = await Notification.updateMany(
      { 
        userId: userId,
        read: false
      },
      { read: true }
    )

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark all notifications as read', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}


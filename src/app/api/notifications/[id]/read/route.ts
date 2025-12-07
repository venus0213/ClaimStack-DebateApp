import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Notification } from '@/lib/db/models'
import mongoose from 'mongoose'

// Helper function to convert NotificationType enum to lowercase string
function convertNotificationType(type: string): string {
  return type.toLowerCase()
}

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
    const notificationId = params.id

    // Ensure database connection
    await connectDB()

    // Validate notification ID format
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid notification ID format' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const notificationObjectId = new mongoose.Types.ObjectId(notificationId)
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Find and update notification (ensure it belongs to the user)
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationObjectId,
        userId: userId // Ensure user can only mark their own notifications as read
      },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Notification not found or unauthorized' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: convertNotificationType(notification.type) as any,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark notification as read', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}


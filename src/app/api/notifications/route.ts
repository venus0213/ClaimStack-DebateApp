import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { requireAuth } from '@/lib/auth/middleware'
import { Notification } from '@/lib/db/models'
import mongoose from 'mongoose'

function convertNotificationType(type: string): string {
  return type.toLowerCase()
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const userId = new mongoose.Types.ObjectId(user.userId)

    let query = Notification.find({ userId }).sort({ createdAt: -1 })

    if (limit !== undefined && limit > 0) {
      query = query.limit(limit)
    }
    
    const notifications = await query.lean()

    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: convertNotificationType(notification.type) as any,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch notifications', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}


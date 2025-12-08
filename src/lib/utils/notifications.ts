import mongoose from 'mongoose'
import { Notification, NotificationType } from '@/lib/db/models'
import { User, Role } from '@/lib/db/models'
import connectDB from '@/lib/db/mongoose'

/**
 * Create a notification for a single user
 */
export async function createNotification(params: {
  userId: string | mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message?: string
  link?: string
}): Promise<void> {
  try {
    await connectDB()
    
    const userId = typeof params.userId === 'string' 
      ? new mongoose.Types.ObjectId(params.userId)
      : params.userId

    await Notification.create({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(params: {
  userIds: (string | mongoose.Types.ObjectId)[]
  type: NotificationType
  title: string
  message?: string
  link?: string
}): Promise<void> {
  try {
    await connectDB()
    
    const notifications = params.userIds.map(userId => ({
      userId: typeof userId === 'string' 
        ? new mongoose.Types.ObjectId(userId)
        : userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
    }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error('Error creating notifications for users:', error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify all admin users
 */
export async function notifyAdmins(params: {
  type: NotificationType
  title: string
  message?: string
  link?: string
}): Promise<void> {
  try {
    await connectDB()
    
    const admins = await User.find({ role: Role.ADMIN })
      .select('_id')
      .lean()

    if (admins.length > 0) {
      const adminIds = admins.map(admin => admin._id)
      await createNotificationsForUsers({
        userIds: adminIds,
        ...params,
      })
    }
  } catch (error) {
    console.error('Error notifying admins:', error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify all users (for platform-wide announcements)
 */
export async function notifyAllUsers(params: {
  type: NotificationType
  title: string
  message?: string
  link?: string
}): Promise<void> {
  try {
    await connectDB()
    
    // Get all user IDs in batches to avoid memory issues
    const batchSize = 1000
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const users = await User.find()
        .select('_id')
        .skip(skip)
        .limit(batchSize)
        .lean()

      if (users.length === 0) {
        hasMore = false
        break
      }

      const userIds = users.map(user => user._id)
      await createNotificationsForUsers({
        userIds,
        ...params,
      })

      skip += batchSize
      if (users.length < batchSize) {
        hasMore = false
      }
    }
  } catch (error) {
    console.error('Error notifying all users:', error)
    // Don't throw - notifications are non-critical
  }
}


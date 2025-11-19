import mongoose, { Schema, Document, Model } from 'mongoose'

export enum NotificationType {
  NEW_EVIDENCE = 'NEW_EVIDENCE',
  NEW_PERSPECTIVE = 'NEW_PERSPECTIVE',
  NEW_COMMENT = 'NEW_COMMENT',
  EVIDENCE_APPROVED = 'EVIDENCE_APPROVED',
  EVIDENCE_REJECTED = 'EVIDENCE_REJECTED',
  PERSPECTIVE_APPROVED = 'PERSPECTIVE_APPROVED',
  PERSPECTIVE_REJECTED = 'PERSPECTIVE_REJECTED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  VOTE_RECEIVED = 'VOTE_RECEIVED',
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message?: string
  link?: string
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    message: {
      type: String,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete (ret as any)._id
        delete (ret as any).__v
        return ret
      },
    },
  }
)

// Indexes
NotificationSchema.index({ userId: 1 })
NotificationSchema.index({ read: 1 })
NotificationSchema.index({ createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification


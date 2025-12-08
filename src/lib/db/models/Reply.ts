import mongoose, { Schema, Document, Model } from 'mongoose'

export enum ReplyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export interface IReply extends Document {
  targetType: 'evidence' | 'perspective'
  targetId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  body: string
  upvotes: number
  downvotes: number
  score: number
  status: ReplyStatus
  createdAt: Date
  updatedAt: Date
}

const ReplySchema = new Schema<IReply>(
  {
    targetType: {
      type: String,
      enum: ['evidence', 'perspective'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ReplyStatus),
      default: ReplyStatus.APPROVED,
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

// Indexes for performance
ReplySchema.index({ targetType: 1, targetId: 1 })
ReplySchema.index({ userId: 1 })
ReplySchema.index({ score: -1 })
ReplySchema.index({ createdAt: -1 })
ReplySchema.index({ status: 1 })


const Reply: Model<IReply> = mongoose.models.Reply || mongoose.model<IReply>('Reply', ReplySchema)

export default Reply


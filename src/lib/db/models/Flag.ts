import mongoose, { Schema, Document, Model } from 'mongoose'

export enum FlagReason {
  MISINFORMATION = 'MISINFORMATION',
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE = 'INAPPROPRIATE',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum FlagStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface IFlag extends Document {
  claimId?: mongoose.Types.ObjectId
  evidenceId?: mongoose.Types.ObjectId
  perspectiveId?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  reason: FlagReason
  description?: string
  status: FlagStatus
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  createdAt: Date
}

const FlagSchema = new Schema<IFlag>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
    },
    evidenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Evidence',
    },
    perspectiveId: {
      type: Schema.Types.ObjectId,
      ref: 'Perspective',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(FlagReason),
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(FlagStatus),
      default: FlagStatus.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
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
FlagSchema.index({ claimId: 1 })
FlagSchema.index({ evidenceId: 1 })
FlagSchema.index({ perspectiveId: 1 })
FlagSchema.index({ status: 1 })

const Flag: Model<IFlag> = mongoose.models.Flag || mongoose.model<IFlag>('Flag', FlagSchema)

export default Flag


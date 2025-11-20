import mongoose, { Schema, Document, Model } from 'mongoose'

export enum EvidenceType {
  URL = 'URL',
  FILE = 'FILE',
  TWEET = 'TWEET',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  INSTAGRAM = 'INSTAGRAM',
  TEXT = 'TEXT',
}

export enum Position {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
}

export enum EvidenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export interface IEvidence extends Document {
  claimId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: EvidenceType
  position: Position
  title?: string
  description?: string
  url?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, any>
  status: EvidenceStatus
  upvotes: number
  downvotes: number
  score: number
  followCount: number
  createdAt: Date
  updatedAt: Date
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(EvidenceType),
      required: true,
    },
    position: {
      type: String,
      enum: Object.values(Position),
      required: true,
    },
    title: {
      type: String,
      maxlength: 500,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
      maxlength: 255,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
      maxlength: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: Object.values(EvidenceStatus),
      default: EvidenceStatus.PENDING,
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
    followCount: {
      type: Number,
      default: 0,
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
EvidenceSchema.index({ claimId: 1 })
EvidenceSchema.index({ userId: 1 })
EvidenceSchema.index({ position: 1 })
EvidenceSchema.index({ status: 1 })
EvidenceSchema.index({ score: -1 })
EvidenceSchema.index({ createdAt: -1 })

const Evidence: Model<IEvidence> = mongoose.models.Evidence || mongoose.model<IEvidence>('Evidence', EvidenceSchema)

export default Evidence


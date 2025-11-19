import mongoose, { Schema, Document, Model } from 'mongoose'
import { Position } from './Evidence'

export enum PerspectiveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export interface IPerspective extends Document {
  claimId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title?: string
  body: string
  position: Position
  sourceUrl?: string
  sourcePlatform?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, any>
  status: PerspectiveStatus
  upvotes: number
  downvotes: number
  score: number
  createdAt: Date
  updatedAt: Date
}

const PerspectiveSchema = new Schema<IPerspective>(
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
    title: {
      type: String,
      maxlength: 500,
    },
    body: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: Object.values(Position),
      required: true,
    },
    sourceUrl: {
      type: String,
    },
    sourcePlatform: {
      type: String,
      maxlength: 50,
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
      enum: Object.values(PerspectiveStatus),
      default: PerspectiveStatus.PENDING,
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
PerspectiveSchema.index({ claimId: 1 })
PerspectiveSchema.index({ userId: 1 })
PerspectiveSchema.index({ position: 1 })
PerspectiveSchema.index({ status: 1 })
PerspectiveSchema.index({ score: -1 })
PerspectiveSchema.index({ createdAt: -1 })

const Perspective: Model<IPerspective> =
  mongoose.models.Perspective || mongoose.model<IPerspective>('Perspective', PerspectiveSchema)

export default Perspective


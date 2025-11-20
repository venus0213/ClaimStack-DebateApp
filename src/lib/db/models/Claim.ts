import mongoose, { Schema, Document, Model } from 'mongoose'

export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export interface IClaim extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  description?: string
  categoryId?: mongoose.Types.ObjectId
  status: ClaimStatus
  forSummary?: string
  againstSummary?: string
  summaryUpdatedAt?: Date
  viewCount: number
  followCount: number
  totalScore: number
  upvotes: number
  downvotes: number
  url?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  createdAt: Date
  updatedAt: Date
}

const ClaimSchema = new Schema<IClaim>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 500,
    },
    description: {
      type: String,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.PENDING,
    },
    forSummary: {
      type: String,
    },
    againstSummary: {
      type: String,
    },
    summaryUpdatedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    followCount: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
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
ClaimSchema.index({ userId: 1 })
ClaimSchema.index({ categoryId: 1 })
ClaimSchema.index({ status: 1 })
ClaimSchema.index({ createdAt: -1 })
ClaimSchema.index({ viewCount: -1 })

const Claim: Model<IClaim> = mongoose.models.Claim || mongoose.model<IClaim>('Claim', ClaimSchema)

export default Claim


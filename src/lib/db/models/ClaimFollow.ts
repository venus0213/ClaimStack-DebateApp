import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IClaimFollow extends Document {
  claimId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  createdAt: Date
}

const ClaimFollowSchema = new Schema<IClaimFollow>(
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

// Compound unique index
ClaimFollowSchema.index({ claimId: 1, userId: 1 }, { unique: true })
ClaimFollowSchema.index({ userId: 1 })
ClaimFollowSchema.index({ claimId: 1 })

const ClaimFollow: Model<IClaimFollow> =
  mongoose.models.ClaimFollow || mongoose.model<IClaimFollow>('ClaimFollow', ClaimFollowSchema)

export default ClaimFollow


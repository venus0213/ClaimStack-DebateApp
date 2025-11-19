import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISavedClaim extends Document {
  userId: mongoose.Types.ObjectId
  claimId: mongoose.Types.ObjectId
  createdAt: Date
}

const SavedClaimSchema = new Schema<ISavedClaim>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
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
SavedClaimSchema.index({ userId: 1, claimId: 1 }, { unique: true })
SavedClaimSchema.index({ userId: 1 })
SavedClaimSchema.index({ claimId: 1 })

const SavedClaim: Model<ISavedClaim> =
  mongoose.models.SavedClaim || mongoose.model<ISavedClaim>('SavedClaim', SavedClaimSchema)

export default SavedClaim


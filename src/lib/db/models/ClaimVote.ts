import mongoose, { Schema, Document, Model } from 'mongoose'
import { VoteType } from './Vote'

export interface IClaimVote extends Document {
  claimId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  voteType: VoteType
  createdAt: Date
}

const ClaimVoteSchema = new Schema<IClaimVote>(
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
    voteType: {
      type: String,
      enum: Object.values(VoteType),
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
ClaimVoteSchema.index({ claimId: 1, userId: 1 }, { unique: true })
ClaimVoteSchema.index({ claimId: 1 })
ClaimVoteSchema.index({ userId: 1 })

const ClaimVote: Model<IClaimVote> =
  mongoose.models.ClaimVote || mongoose.model<IClaimVote>('ClaimVote', ClaimVoteSchema)

export default ClaimVote


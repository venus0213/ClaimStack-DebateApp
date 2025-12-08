import mongoose, { Schema, Document, Model } from 'mongoose'
import { VoteType } from './Vote'

export interface IReplyVote extends Document {
  replyId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  voteType: VoteType
  createdAt: Date
}

const ReplyVoteSchema = new Schema<IReplyVote>(
  {
    replyId: {
      type: Schema.Types.ObjectId,
      ref: 'Reply',
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

// Compound unique index - one vote per user per reply
ReplyVoteSchema.index({ replyId: 1, userId: 1 }, { unique: true })
ReplyVoteSchema.index({ replyId: 1 })
ReplyVoteSchema.index({ userId: 1 })

const ReplyVote: Model<IReplyVote> =
  mongoose.models.ReplyVote || mongoose.model<IReplyVote>('ReplyVote', ReplyVoteSchema)

export default ReplyVote


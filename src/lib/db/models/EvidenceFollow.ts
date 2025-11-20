import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IEvidenceFollow extends Document {
  evidenceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  createdAt: Date
}

const EvidenceFollowSchema = new Schema<IEvidenceFollow>(
  {
    evidenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Evidence',
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
EvidenceFollowSchema.index({ evidenceId: 1, userId: 1 }, { unique: true })
EvidenceFollowSchema.index({ userId: 1 })
EvidenceFollowSchema.index({ evidenceId: 1 })

const EvidenceFollow: Model<IEvidenceFollow> =
  mongoose.models.EvidenceFollow || mongoose.model<IEvidenceFollow>('EvidenceFollow', EvidenceFollowSchema)

export default EvidenceFollow


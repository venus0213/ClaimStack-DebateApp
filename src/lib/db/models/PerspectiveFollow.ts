import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPerspectiveFollow extends Document {
  perspectiveId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  createdAt: Date
}

const PerspectiveFollowSchema = new Schema<IPerspectiveFollow>(
  {
    perspectiveId: {
      type: Schema.Types.ObjectId,
      ref: 'Perspective',
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
PerspectiveFollowSchema.index({ perspectiveId: 1, userId: 1 }, { unique: true })
PerspectiveFollowSchema.index({ userId: 1 })
PerspectiveFollowSchema.index({ perspectiveId: 1 })

const PerspectiveFollow: Model<IPerspectiveFollow> =
  mongoose.models.PerspectiveFollow || mongoose.model<IPerspectiveFollow>('PerspectiveFollow', PerspectiveFollowSchema)

export default PerspectiveFollow


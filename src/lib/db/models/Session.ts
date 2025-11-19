import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId
  sessionToken: string
  expires: Date
  createdAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      // No maxlength constraint - JWT tokens can vary in length
    },
    expires: {
      type: Date,
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

// Indexes
SessionSchema.index({ sessionToken: 1 })
SessionSchema.index({ userId: 1 })
SessionSchema.index({ expires: 1 })

// Delete cached model if it exists to ensure schema changes take effect
if (mongoose.models.Session) {
  delete mongoose.models.Session
}

const Session: Model<ISession> = mongoose.model<ISession>('Session', SessionSchema)

export default Session


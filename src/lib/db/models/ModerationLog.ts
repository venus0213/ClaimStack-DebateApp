import mongoose, { Schema, Document, Model } from 'mongoose'

export enum ModerationAction {
  APPROVE_CLAIM = 'APPROVE_CLAIM',
  REJECT_CLAIM = 'REJECT_CLAIM',
  APPROVE_EVIDENCE = 'APPROVE_EVIDENCE',
  REJECT_EVIDENCE = 'REJECT_EVIDENCE',
  APPROVE_PERSPECTIVE = 'APPROVE_PERSPECTIVE',
  REJECT_PERSPECTIVE = 'REJECT_PERSPECTIVE',
  FLAG_CLAIM = 'FLAG_CLAIM',
  FLAG_EVIDENCE = 'FLAG_EVIDENCE',
  FLAG_PERSPECTIVE = 'FLAG_PERSPECTIVE',
  ESCALATE = 'ESCALATE',
  REMOVE_CONTENT = 'REMOVE_CONTENT',
}

export interface IModerationLog extends Document {
  moderatorId: mongoose.Types.ObjectId
  action: ModerationAction
  targetType: string
  targetId: string
  reason?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const ModerationLogSchema = new Schema<IModerationLog>(
  {
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ModerationAction),
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      maxlength: 20,
    },
    targetId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
ModerationLogSchema.index({ moderatorId: 1 })
ModerationLogSchema.index({ targetType: 1, targetId: 1 })

const ModerationLog: Model<IModerationLog> =
  mongoose.models.ModerationLog || mongoose.model<IModerationLog>('ModerationLog', ModerationLogSchema)

export default ModerationLog


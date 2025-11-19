import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId
  provider: string
  providerAccountId: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
  idToken?: string
  createdAt: Date
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      required: true,
      maxlength: 50,
    },
    providerAccountId: {
      type: String,
      required: true,
      maxlength: 255,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Number,
    },
    tokenType: {
      type: String,
      maxlength: 50,
    },
    scope: {
      type: String,
    },
    idToken: {
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

// Compound unique index
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true })

const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema)

export default Account


import mongoose, { Schema, Document, Model } from 'mongoose'

export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  email: string
  username: string
  firstName?: string
  lastName?: string
  passwordHash?: string
  avatarUrl?: string
  bio?: string
  role: Role
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    passwordHash: {
      type: String,
      maxlength: 255,
    },
    avatarUrl: {
      type: String,
    },
    bio: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete (ret as any)._id
        delete (ret as any).__v
        delete ret.passwordHash
        return ret
      },
    },
  }
)

// Indexes
UserSchema.index({ email: 1 })
UserSchema.index({ username: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User


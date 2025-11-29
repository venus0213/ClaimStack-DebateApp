import connectDB from '@/lib/db/mongoose'
import { Session, User } from '@/lib/db/models'
import { signToken, verifyToken, JWTPayload } from './jwt'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'

const SESSION_COOKIE_NAME = 'claimstack_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createSession(userId: string, userData: JWTPayload): Promise<string> {
  await connectDB()

  const sessionToken = signToken(userData)

  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  await Session.create({
    userId: new mongoose.Types.ObjectId(userId),
    sessionToken,
    expires,
  })

  return sessionToken
}

export async function getSession(sessionToken: string): Promise<JWTPayload | null> {
  try {
    await connectDB()

    const payload = verifyToken(sessionToken)
    if (!payload) {
      return null
    }

    const session = await Session.findOne({ sessionToken }).populate('userId')

    if (!session || session.expires < new Date()) {
      return null
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return null
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
      return null
    }
    console.error('Session error:', error)
    return null
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await connectDB()

  await Session.deleteMany({ sessionToken })
}

export async function getSessionFromRequest(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    return getSession(sessionToken)
  } catch (error) {
    return null
  }
}


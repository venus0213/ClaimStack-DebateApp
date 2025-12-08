import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const session = await getSessionFromRequest()

    if (!session) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      )
    }

    const user = await User.findById(new mongoose.Types.ObjectId(session.userId)).select(
      '-passwordHash -__v'
    )

    if (!user) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
      isAuthenticated: true,
    })
  } catch (error) {
    if (error instanceof Error && !error.message.includes('ETIMEDOUT')) {
      console.error('Session error:', error)
    }
    return NextResponse.json(
      { user: null, isAuthenticated: false },
      { status: 200 }
    )
  }
}


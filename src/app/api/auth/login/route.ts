import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email },
      ],
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const sessionToken = await createSession(user._id.toString(), {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    })

    const cookieStore = await cookies()
    cookieStore.set('claimstack_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

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
      token: sessionToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


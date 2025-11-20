import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { hashPassword } from '@/lib/auth/password'
import { createSession, deleteSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB()

    const body = await request.json()
    
    // Validate input
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, username, password, firstName, lastName } = validationResult.data

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username },
      ],
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      firstName,
      lastName,
    })

    // Create session
    let sessionToken: string
    try {
      sessionToken = await createSession(user._id.toString(), {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      })
    } catch (sessionError) {
      // If session creation fails, delete the user to maintain data consistency
      await User.findByIdAndDelete(user._id)
      const errorMessage = sessionError instanceof Error ? sessionError.message : 'Failed to create session'
      return NextResponse.json(
        { error: 'Failed to create session. Please try again.', details: errorMessage },
        { status: 500 }
      )
    }

    // Set cookie
    try {
      const cookieStore = await cookies()
      cookieStore.set('claimstack_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    } catch (cookieError) {
      // If cookie setting fails, delete the session and user
      await deleteSession(sessionToken)
      await User.findByIdAndDelete(user._id)
      return NextResponse.json(
        { error: 'Failed to set session cookie. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}


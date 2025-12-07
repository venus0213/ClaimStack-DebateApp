import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import VerificationToken from '@/lib/db/models/VerificationToken'
import { hashPassword } from '@/lib/auth/password'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { token, email, password } = validationResult.data
    const verificationToken = await VerificationToken.findOne({
      identifier: email.toLowerCase(),
      token,
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      await VerificationToken.deleteOne({ _id: verificationToken._id })
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const passwordHash = await hashPassword(password)

    user.passwordHash = passwordHash
    await user.save()

    await VerificationToken.deleteOne({ _id: verificationToken._id })

    return NextResponse.json(
      {
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}


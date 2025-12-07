import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import VerificationToken from '@/lib/db/models/VerificationToken'
import { sendEmail } from '@/lib/email/service'
import { generatePasswordResetEmail } from '@/lib/email/templates'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email } = validationResult.data
    const user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      const resetToken = nanoid(32)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await VerificationToken.deleteMany({
        identifier: email.toLowerCase(),
      })

      await VerificationToken.create({
        identifier: email.toLowerCase(),
        token: resetToken,
        expires: expiresAt,
      })

      try {
        const emailContent = generatePasswordResetEmail({
          firstName: user.firstName,
          username: user.username,
          email: user.email,
          resetToken,
          expiresInHours: 24,
        })

        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
      }
    }

    return NextResponse.json(
      {
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}


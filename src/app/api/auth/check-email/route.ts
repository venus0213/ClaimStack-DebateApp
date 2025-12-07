import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { z } from 'zod'

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validationResult = checkEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email } = validationResult.data
    const user = await User.findOne({ email: email.toLowerCase() })

    return NextResponse.json(
      {
        exists: !!user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Check email error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User, Role } from '@/lib/db/models'
import { requireAdmin } from '@/lib/auth/middleware'
import { hashPassword } from '@/lib/auth/password'
import mongoose from 'mongoose'
import { z } from 'zod'

const updateUserSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return authResult.error
    }

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    if (authResult.user.userId === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndDelete(new mongoose.Types.ObjectId(id))

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Failed to delete user', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return authResult.error
    }

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { role, password } = validationResult.data

    const user = await User.findById(new mongoose.Types.ObjectId(id))

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (role && authResult.user.userId === id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    if (role) {
      user.role = role as Role
    }

    if (password) {
      user.passwordHash = await hashPassword(password)
    } 
    await user.save()

    const updatedUser = await User.findById(id).select('-passwordHash -__v').lean()

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser!._id.toString(),
        email: updatedUser!.email,
        username: updatedUser!.username,
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        avatarUrl: updatedUser!.avatarUrl,
        bio: updatedUser!.bio,
        role: updatedUser!.role,
        emailVerified: updatedUser!.emailVerified,
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Failed to update user', details: errorMessage },
      { status: 500 }
    )
  }
}


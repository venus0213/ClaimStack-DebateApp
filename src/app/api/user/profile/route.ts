import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import mongoose from 'mongoose'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  username: z.string().min(3).max(50).optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Ensure database connection
    await connectDB()

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle password change separately
    if (body.currentPassword && body.newPassword) {
      const passwordValidation = changePasswordSchema.safeParse({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      })

      if (!passwordValidation.success) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Validation failed', 
            details: passwordValidation.error.errors 
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Get user from database
      const userDoc = await User.findById(new mongoose.Types.ObjectId(user.userId))
      if (!userDoc) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User not found' 
          },
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify current password
      if (!userDoc.passwordHash) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Password change not available for this account' 
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const isPasswordValid = await verifyPassword(
        passwordValidation.data.currentPassword,
        userDoc.passwordHash
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Current password is incorrect' 
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Hash new password
      const newPasswordHash = await hashPassword(passwordValidation.data.newPassword)

      // Update password
      userDoc.passwordHash = newPasswordHash
      await userDoc.save()

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    // Handle profile update
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const updateData = validationResult.data

    // Get user from database
    const userDoc = await User.findById(new mongoose.Types.ObjectId(user.userId))
    if (!userDoc) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if username is being changed and if it's already taken
    if (updateData.username && updateData.username !== userDoc.username) {
      const existingUser = await User.findOne({ username: updateData.username })
      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Username is already taken' 
          },
          { 
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Update user fields
    if (updateData.firstName !== undefined) {
      userDoc.firstName = updateData.firstName || undefined
    }
    if (updateData.lastName !== undefined) {
      userDoc.lastName = updateData.lastName || undefined
    }
    if (updateData.bio !== undefined) {
      userDoc.bio = updateData.bio || undefined
    }
    if (updateData.avatarUrl !== undefined) {
      userDoc.avatarUrl = updateData.avatarUrl || undefined
    }
    if (updateData.username !== undefined) {
      userDoc.username = updateData.username
    }

    await userDoc.save()

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
        id: userDoc._id.toString(),
        email: userDoc.email,
        username: userDoc.username,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        avatarUrl: userDoc.avatarUrl,
        bio: userDoc.bio,
        role: userDoc.role,
        createdAt: userDoc.createdAt,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}


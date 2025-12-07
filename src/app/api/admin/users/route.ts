import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')

    const query: any = {}
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ]
    }

    if (role) {
      query.role = role.toUpperCase()
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Failed to fetch users', details: errorMessage },
      { status: 500 }
    )
  }
}


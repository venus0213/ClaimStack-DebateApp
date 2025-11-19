import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { uploadFile } from '@/lib/storage/upload'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 25MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const acceptedFormats = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'mp4']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedFormats.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Upload file
    const uploadResult = await uploadFile(file, folder)

    return NextResponse.json({
      success: true,
      data: uploadResult,
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Extract error message with more details
    let errorMessage = 'Failed to upload file'
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for common error patterns
      if (error.message.includes('Unexpected token')) {
        errorMessage = 'Invalid response from storage service. Please check your Supabase configuration and ensure the storage bucket exists.'
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Storage service credentials are invalid or missing. Please check your environment variables.'
      } else if (error.message.includes('bucket')) {
        errorMessage = error.message // Already a helpful message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      console.error('Unexpected error type:', typeof error, error)
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


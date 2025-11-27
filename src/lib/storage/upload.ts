// Unified file upload handler for S3 or Supabase Storage

import { createClient } from '@supabase/supabase-js'

export interface UploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }

  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function uploadFile(file: File, folder: string = 'uploads'): Promise<UploadResult> {
  const storageType = process.env.STORAGE_TYPE || 'supabase'

  if (storageType === 's3') {
    return uploadToS3(file, folder)
  } else {
    return uploadToSupabase(file, folder)
  }
}

async function uploadToS3(file: File, folder: string): Promise<UploadResult> {
  
  // TODO: Implement S3 upload
  throw new Error('S3 upload not implemented')
}

async function uploadToSupabase(file: File, folder: string): Promise<UploadResult> {
  try {
    const supabase = getSupabaseClient()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'claimstack-files'

    if (!bucket) {
      throw new Error('Supabase storage bucket is not configured. Please set SUPABASE_STORAGE_BUCKET environment variable.')
    }

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', {
        message: error.message,
        name: error.name,
      })
      
      const errorMessage = error.message || 'Unknown error'
      
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error(`Storage bucket "${bucket}" not found. Please create the bucket in your Supabase dashboard.`)
      }
      if (errorMessage.includes('new row violates row-level security') || errorMessage.includes('RLS') || errorMessage.includes('permission denied')) {
        throw new Error('Storage bucket access denied. Please check your Supabase RLS policies.')
      }
      if (errorMessage.includes('JWT') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid')) {
        throw new Error('Invalid Supabase credentials. Please check your SUPABASE_SERVICE_ROLE_KEY.')
      }
      
      throw new Error(`Failed to upload file: ${errorMessage}`)
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned from Supabase')
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file')
    }

    return {
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to upload file: ${String(error)}`)
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const storageType = process.env.STORAGE_TYPE || 'supabase'

  if (storageType === 's3') {
    // TODO: Implement S3 deletion
    throw new Error('S3 deletion not implemented')
  } else {
    await deleteFromSupabase(fileUrl)
  }
}

async function deleteFromSupabase(fileUrl: string): Promise<void> {
  const supabase = getSupabaseClient()
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'claimstack-files'

  const urlParts = fileUrl.split('/')
  const fileName = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/')

  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

export function getPublicUrl(fileUrl: string): string {
  return fileUrl
}


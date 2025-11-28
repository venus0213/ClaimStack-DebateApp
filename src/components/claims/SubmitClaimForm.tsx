'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'
// import { ForAgainstToggle } from '@/components/claims/ForAgainstToggle'
import { Button } from '@/components/ui/Button'
import { SuccessModal } from '@/components/ui/SuccessModal'
import { cn } from '@/lib/utils/cn'
import { ArrowUpIcon, CheckIcon } from '@/components/ui/Icons'
import { useClaimsStore } from '@/store/claimsStore'

const categoryOptions: DropdownOption[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'science', label: 'Science' },
  { value: 'politics', label: 'Politics' },
  { value: 'economics', label: 'Economics' },
  { value: 'education', label: 'Education' },
]

const evidenceTypeOptions: DropdownOption[] = [
  { value: 'url', label: 'URL' },
  { value: 'youtube', label: 'YouTube Video' },
  { value: 'tweet', label: 'Tweet' },
  { value: 'file', label: 'Upload File' },
]

const acceptedFormats = ['pdf', 'docx', 'jpg', 'png', 'mp4']
const maxSize = 25 * 1024 * 1024 // 25MB

export interface SubmitClaimFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isModal?: boolean
}

export const SubmitClaimForm: React.FC<SubmitClaimFormProps> = ({
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const router = useRouter()
  const { createClaim, isLoading: storeLoading } = useClaimsStore()
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    evidenceType: 'url',
    evidenceUrl: '',
    evidenceDescription: '',
    position: 'for' as 'for' | 'against',
  })
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    title?: string
    category?: string
  }>({})

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxSize) {
      setFileError('File exceeds maximum size.')
      setFile(null)
      return
    }

    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedFormats.includes(extension)) {
      setFileError(`Accepted formats: ${acceptedFormats.join(', ')}`)
      setFile(null)
      return
    }

    setFile(selectedFile)
    setFileError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: { title?: string; category?: string } = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a claim title'
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }
    
    // Validate evidence if provided
    if (formData.evidenceType === 'file' && !file) {
      setFileError('Please select a file')
      return
    }
    
    if (formData.evidenceType !== 'file' && formData.evidenceUrl && !formData.evidenceUrl.trim()) {
      // URL evidence is optional, but if evidenceType is set, URL should be provided
      if (formData.evidenceType === 'url' || formData.evidenceType === 'youtube' || formData.evidenceType === 'tweet') {
        // This is handled by optional field, so we'll allow empty
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    setSubmitError(null)
    setFileError(null)

    // Prepare claim data
    const claimData: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category || undefined,
      position: formData.position,
    }

    // Add evidence data if provided
    if (formData.evidenceType === 'file' && file) {
      claimData.evidenceType = 'file'
      claimData.file = file
      claimData.evidenceDescription = formData.evidenceDescription.trim() || undefined
    } else if (formData.evidenceUrl && formData.evidenceUrl.trim()) {
      claimData.evidenceType = formData.evidenceType
      claimData.evidenceUrl = formData.evidenceUrl.trim()
      claimData.evidenceDescription = formData.evidenceDescription.trim() || undefined
    }

    // Create claim using store
    const result = await createClaim(claimData)

    if (result.success && result.claim) {
      setIsSuccessModalOpen(true)
      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        evidenceType: 'url',
        evidenceUrl: '',
        evidenceDescription: '',
        position: 'for',
      })
      setFile(null)
      setFileError(null)
    } else {
      setSubmitError(result.error || 'Failed to submit claim')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Claim Title"
            placeholder="Enter your claim"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value })
              if (errors.title) {
                setErrors({ ...errors, title: undefined })
              }
            }}
            error={errors.title}
            className="w-full rounded-full"
          />
        </div>
        <div>
          <label className="block text-sm items-start font-medium text-[#666666] mb-1">
            Select Category
          </label>
          <Dropdown
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => {
              setFormData({ ...formData, category: value })
              if (errors.category) {
                setErrors({ ...errors, category: undefined })
              }
            }}
            error={errors.category}
            placeholder="Category"
          />
        </div>
      </div>

      <Textarea
        label="Description (optional)"
        placeholder="Provide additional context"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        maxLength={500}
        showCharCount
      />

      <div>
        <h2 className="text-sm font-semibold text-[#666666] mb-2">
          Add Initial Evidence (optional)
        </h2>

        <div className="space-y-4">
          <div>
            <Dropdown
              options={evidenceTypeOptions}
              value={formData.evidenceType}
              onChange={(value) => {
                setFormData({ ...formData, evidenceType: value, evidenceUrl: '' })
                setFile(null)
                setFileError(null)
              }}
            />
          </div>

          {formData.evidenceType === 'file' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className={cn(
                'bg-gray-50 rounded-2xl p-4 border',
                fileError ? 'border-red-500' : 'border-gray-300'
              )}>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={acceptedFormats.map((f) => `.${f}`).join(',')}
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white rounded-full px-4 py-2 flex items-center justify-center gap-2 text-gray-900 font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <span>Upload File</span>
                  <ArrowUpIcon className="w-5 h-5" />
                </Button>
                
                <div className="border-t border-gray-200 my-4"></div>
                
                {file && !fileError && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-gray-900">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                    </p>
                  </div>
                )}
                
                {fileError && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-600">{fileError}</p>
                  </div>
                )}
                
                <div className="flex justify-between text-xs">
                  <span>
                    <span className="font-semibold text-gray-900">Accepted formats:</span>{' '}
                    <span className="text-gray-500">{acceptedFormats.map(f => `.${f}`).join(', ')}</span>
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">Max size:</span>{' '}
                    <span className="text-gray-500">25 MB</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <Input
              placeholder="https://example.com/article"
              value={formData.evidenceUrl}
              onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
              className="w-full rounded-full"
            />
          )}

          <Textarea
            placeholder="Brief description of the evidence"
            value={formData.evidenceDescription}
            onChange={(e) => setFormData({ ...formData, evidenceDescription: e.target.value })}
            maxLength={500}
            showCharCount
          />

          {/* <div>
            <ForAgainstToggle
              position={formData.position}
              onChange={(pos) => setFormData({ ...formData, position: pos })}
              fullWidth
            />
          </div> */}
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pb-2">
        <Button type="submit" variant="primary" isLoading={storeLoading} className='rounded-full w-full'>
          Submit Claim
        </Button>
      </div>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false)
          if (onSuccess) {
            onSuccess()
          } else if (!isModal) {
            router.push('/browse')
          }
        }}
        type="claim"
      />
    </form>
  )
}


'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ForAgainstToggle } from '@/components/claims/ForAgainstToggle'
import { Button } from '@/components/ui/Button'
import { ArrowUpIcon, CheckIcon } from '@/components/ui/Icons'
import { SuccessModal } from '@/components/ui/SuccessModal'
import { useEvidenceStore } from '@/store/evidenceStore'

export interface EvidenceUploadProps {
  claimId: string
  onUpload?: (data: EvidenceUploadData) => void
  onClose: () => void
  isLoading?: boolean
}

export interface EvidenceUploadData {
  type: 'url' | 'file'
  url?: string
  file?: File
  title?: string
  description?: string
  position: 'for' | 'against'
}

const evidenceTypeOptions: DropdownOption[] = [
  { value: 'url', label: 'URL' },
  { value: 'file', label: 'Upload File' },
]

const acceptedFormats = ['pdf', 'docx', 'jpg', 'png', 'mp4']
const maxSize = 25 * 1024 * 1024 // 25MB

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  claimId,
  onUpload,
  onClose,
  isLoading: externalLoading,
}) => {
  const { createEvidence, isLoading: storeLoading } = useEvidenceStore()
  const [evidenceType, setEvidenceType] = useState<'url' | 'file'>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [position, setPosition] = useState<'for' | 'against'>('for')
  const [error, setError] = useState<string | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isLoading = externalLoading || storeLoading

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError('File exceeds maximum size.')
      setFile(null)
      return
    }

    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedFormats.includes(extension)) {
      setError(`Accepted formats: ${acceptedFormats.join(', ')}`)
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleSubmit = async () => {
    if (evidenceType === 'url' && !url.trim()) {
      setError('Please enter a URL')
      return
    }
    
    if (evidenceType === 'file' && !file) {
      setError('Please select a file')
      return
    }
    
    setError(null)
    
    // Prepare evidence data
    const evidenceData: any = {
      type: evidenceType,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      position,
    }
    
    if (evidenceType === 'url') {
      evidenceData.url = url.trim()
    } else if (evidenceType === 'file' && file) {
      evidenceData.file = file
    }
    
    // Create evidence using store
    const result = await createEvidence(claimId, evidenceData)

    if (result.success && result.evidence) {
      // Call onUpload callback if provided
      if (onUpload) {
        onUpload({
          type: evidenceType,
          url: evidenceType === 'url' ? url : undefined,
          file: evidenceType === 'file' ? file! : undefined,
          title,
          description,
          position,
        })
      }
      
      // Show success modal
      setIsSuccessModalOpen(true)
      
      // Reset form
      setUrl('')
      setFile(null)
      setTitle('')
      setDescription('')
      setPosition('for')
      setEvidenceType('url')
    } else {
      setError(result.error || 'Failed to submit evidence')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          label="Title"
          placeholder="Enter a title for your evidence"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
          className="w-full rounded-full mb-4"
        />

        <Textarea
        label="Brief description (optional)"
        placeholder="You can add context or reasoning"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        showCharCount
        />

        <label className="block text-sm font-medium text-[#666666] mb-2">
          Evidence Type
        </label>
        <Dropdown
          options={evidenceTypeOptions}
          value={evidenceType}
          onChange={(value) => {
            setEvidenceType(value as 'url' | 'file')
            setError(null)
          }}
        />
      </div>

      {evidenceType === 'url' ? (
        <Input
          placeholder="Paste the link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error || undefined}
          className="w-full rounded-full"
        />
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <div className={cn(
            'bg-gray-50 rounded-2xl p-4 border',
            error ? 'border-red-500' : 'border-gray-300'
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
            
            {file && !error && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-900">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </p>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-600">{error}</p>
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
      )}

      <div>
        <ForAgainstToggle
          position={position}
          onChange={setPosition}
          fullWidth
        />
      </div>

      <div className="flex justify-end py-2">
        <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} className='rounded-full w-full'>
          Submit Evidence
        </Button>
      </div>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false)
          onClose()
        }}
        type="evidence"
      />
    </div>
  )
}


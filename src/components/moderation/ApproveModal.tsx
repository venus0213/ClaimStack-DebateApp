'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dropdown } from '@/components/ui/Dropdown'
import { CheckmarkIcon } from '@/components/ui/Icons'
import { useClaimsStore } from '@/store/claimsStore'
import { Claim } from '@/lib/types'

interface ApproveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  claimId?: string
  claim?: Claim
}

const EDIT_REASON_OPTIONS = [
  { value: 'grammar', label: 'Grammar/Spelling Correction' },
  { value: 'clarity', label: 'Clarity Improvement' },
  { value: 'accuracy', label: 'Accuracy Correction' },
  { value: 'formatting', label: 'Formatting Improvement' },
  { value: 'seo', label: 'SEO Optimization' },
  { value: 'policy', label: 'Policy Compliance' },
  { value: 'other', label: 'Other' },
]

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  claimId,
  claim: initialClaim,
}) => {
  const { approveClaim, currentClaim } = useClaimsStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [claim, setClaim] = useState<Claim | null>(initialClaim || null)
  const [isLoadingClaim, setIsLoadingClaim] = useState(false)
  
  // Editable fields
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSeoTitle, setEditedSeoTitle] = useState('')
  const [editedSeoDescription, setEditedSeoDescription] = useState('')
  
  // Edit reason
  const [editReasonType, setEditReasonType] = useState('')
  const [editReasonText, setEditReasonText] = useState('')
  const [editReasonError, setEditReasonError] = useState('')

  // Fetch claim if only claimId is provided
  useEffect(() => {
    if (isOpen && claimId && !initialClaim) {
      setIsLoadingClaim(true)
      fetch(`/api/claims/${claimId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.claim) {
            setClaim(data.claim)
          }
          setIsLoadingClaim(false)
        })
        .catch(() => {
          setIsLoadingClaim(false)
        })
    } else if (isOpen && initialClaim) {
      setClaim(initialClaim)
    } else if (isOpen && claimId && currentClaim && currentClaim.id === claimId) {
      setClaim(currentClaim)
    }
  }, [isOpen, claimId, initialClaim, currentClaim])

  // Initialize form fields when claim is loaded
  useEffect(() => {
    if (claim) {
      setEditedTitle(claim.title || '')
      setEditedDescription(claim.description || '')
      setEditedSeoTitle(claim.seoTitle || '')
      setEditedSeoDescription(claim.seoDescription || '')
      setEditReasonType('')
      setEditReasonText('')
      setEditReasonError('')
    }
  }, [claim])

  const hasTitleChanged = claim ? editedTitle !== claim.title : false
  const hasDescriptionChanged = claim ? editedDescription !== (claim.description || '') : false
  const requiresEditReason = hasTitleChanged || hasDescriptionChanged

  const validateForm = (): boolean => {
    if (requiresEditReason) {
      if (!editReasonType) {
        setEditReasonError('Please select an edit reason')
        return false
      }
      if (editReasonType === 'other' && !editReasonText.trim()) {
        setEditReasonError('Please provide a reason for editing')
        return false
      }
    }
    if (!editedTitle.trim()) {
      return false
    }
    setEditReasonError('')
    return true
  }

  const handleConfirm = async () => {
    if (!claimId && !claim) {
      onConfirm()
      return
    }

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    try {
      const editReason = editReasonType === 'other' 
        ? editReasonText.trim() 
        : EDIT_REASON_OPTIONS.find(opt => opt.value === editReasonType)?.label || editReasonText.trim()

      const result = await approveClaim(claimId || claim?.id || '', {
        title: hasTitleChanged ? editedTitle : undefined,
        description: hasDescriptionChanged ? editedDescription : undefined,
        seoTitle: editedSeoTitle !== claim?.seoTitle ? editedSeoTitle : undefined,
        seoDescription: editedSeoDescription !== claim?.seoDescription ? editedSeoDescription : undefined,
        titleEditReason: hasTitleChanged ? editReason : undefined,
        // titleEditReasonText: hasTitleChanged ? editReasonText.trim() : undefined,
        // descriptionEditReason: hasDescriptionChanged ? editReason : undefined,
        // descriptionEditReasonText: hasDescriptionChanged ? editReasonText.trim() : undefined,
      })
      
      if (result.success) {
        onConfirm()
      } else {
        console.error('Failed to approve claim:', result.error)
        setEditReasonError(result.error || 'Failed to approve claim')
      }
    } catch (error) {
      console.error('Error approving claim:', error)
      setEditReasonError('An error occurred while approving the claim')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (isLoadingClaim) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600 dark:text-gray-400">Loading claim data...</div>
        </div>
      </Modal>
    )
  }

  if (!claim) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600 dark:text-red-400">Claim not found</div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl2"
      showCloseButton={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col font-semibold text-2xl items-center justify-center py-2">
          <span className="text-gray-900 dark:text-gray-100">Are You Sure You Want To</span>
          <div className="text-blue-600 dark:text-blue-400 font-semibold">Approve This Content?</div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Claim Title and Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Claim Content (Will be posted)
            </h3>
            
            <div className="space-y-3">
              <Input
                label="Title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter claim title"
                maxLength={500}
                error={!editedTitle.trim() ? 'Title is required' : undefined}
              />
              
              <Textarea
                label="Description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter claim description"
                rows={6}
                maxLength={5000}
                showCharCount
              />
            </div>
          </div>

          {/* Right Side: SEO Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              SEO Information
            </h3>
            
            <div className="space-y-3">
              <Input
                label="SEO Title"
                value={editedSeoTitle}
                onChange={(e) => setEditedSeoTitle(e.target.value)}
                placeholder="Enter SEO title (optional)"
                maxLength={60}
                helperText="Recommended: 50-60 characters"
              />
              
              <Textarea
                label="SEO Description"
                value={editedSeoDescription}
                onChange={(e) => setEditedSeoDescription(e.target.value)}
                placeholder="Enter SEO description (optional)"
                rows={4}
                maxLength={160}
                showCharCount
                helperText="Recommended: 150-160 characters"
              />
            </div>
          </div>
        </div>

        {/* Edit Reason Section */}
        {(hasTitleChanged || hasDescriptionChanged) && (
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Edit Reason <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've made changes to the title or description. Please provide a reason for these edits.
            </p>
            
            <div className="space-y-3">
              <Dropdown
                options={EDIT_REASON_OPTIONS}
                value={editReasonType}
                onChange={setEditReasonType}
                placeholder="Select a reason"
                error={editReasonError && !editReasonType ? editReasonError : undefined}
              />
              
              {editReasonType === 'other' && (
                <Textarea
                  label="Additional Details"
                  value={editReasonText}
                  onChange={(e) => setEditReasonText(e.target.value)}
                  placeholder="Please provide details about the edit reason"
                  rows={3}
                  maxLength={500}
                  error={editReasonError && !editReasonText.trim() ? editReasonError : undefined}
                />
              )}
              
              {editReasonError && editReasonType && (editReasonType !== 'other' || editReasonText.trim()) && (
                <p className="text-sm text-red-600 dark:text-red-400">{editReasonError}</p>
              )}
            </div>
          </div>
        )}

        {/* Other Info Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Other Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Author:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {claim.user?.username ? `@${claim.user.username}` : 'Unknown'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Created Date:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {formatDate(claim.createdAt)}
              </span>
            </div>
            
            {claim.fileName && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Media:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {claim.fileName} ({formatFileSize(claim.fileSize)})
                </span>
              </div>
            )}
            
            {claim.url && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Source URL:</span>
                <a 
                  href={claim.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {claim.url.length > 40 ? `${claim.url.substring(0, 40)}...` : claim.url}
                </a>
              </div>
            )}
            
            {claim.category && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {claim.category.name}
                </span>
              </div>
            )}
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100 capitalize">
                {claim.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            className='rounded-full'
            disabled={isProcessing || !editedTitle.trim()}
          >
            {isProcessing ? 'Processing...' : 'Approve and Publish'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className='rounded-full'
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dropdown } from '@/components/ui/Dropdown'
import { Claim } from '@/lib/types'

interface EditClaimModalProps {
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

export const EditClaimModal: React.FC<EditClaimModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  claimId,
  claim: initialClaim,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [claim, setClaim] = useState<Claim | null>(initialClaim || null)
  const [isLoadingClaim, setIsLoadingClaim] = useState(false)
  
  // Editable fields
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  
  // Edit reason
  const [editReasonType, setEditReasonType] = useState('')
  const [editReasonText, setEditReasonText] = useState('')
  const [editReasonError, setEditReasonError] = useState('')

  // Fetch claim if only claimId is provided
  useEffect(() => {
    if (isOpen && claimId && !initialClaim) {
      setIsLoadingClaim(true)
      fetch(`/api/claims/${claimId}`, {
        credentials: 'include',
      })
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
    }
  }, [isOpen, claimId, initialClaim])

  // Initialize form fields when claim is loaded
  useEffect(() => {
    if (claim) {
      setEditedTitle(claim.title || '')
      setEditedDescription(claim.description || '')
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
      setEditReasonError('Title is required')
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

      const body: any = {
        status: claim?.status || 'approved', // Keep current status
      }

      // Include edits if provided
      if (hasTitleChanged) {
        body.title = editedTitle
        body.titleEditReason = editReason
      }
      if (hasDescriptionChanged) {
        body.description = editedDescription
        body.descriptionEditReason = editReason
      }

      const response = await fetch(`/api/claims/${claimId || claim?.id || ''}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update claim')
      }

      onConfirm()
    } catch (error) {
      console.error('Error updating claim:', error)
      setEditReasonError(error instanceof Error ? error.message : 'An error occurred while updating the claim')
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
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col font-semibold text-2xl items-center justify-center py-2">
          <span className="text-gray-900 dark:text-gray-100">Edit Claim</span>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1">
          {/* Left Side: Claim Title */}
          <div className="space-y-4 mb-10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Title
            </h3>
            
            <div className="space-y-3">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter claim title"
                maxLength={500}
                error={!editedTitle.trim() ? 'Title is required' : undefined}
              />
            </div>
          </div>

          {/* Right Side: Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Description
            </h3>
            
            <div className="space-y-3">
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter claim description"
                rows={6}
                // maxLength={5000}
                showCharCount
              />
            </div>
          </div>
        </div>

        {/* Edit Reason Section */}
        {requiresEditReason && (
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
          {/* <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Other Information
          </h3> */}
          
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
            isLoading={isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Save Changes'}
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


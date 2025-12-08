'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FlagIcon } from '@/components/ui/Icons'

interface RejectionMessageModalProps {
  isOpen: boolean
  onClose: () => void
  rejectionFeedback: string
  claimTitle?: string
}

export const RejectionMessageModal: React.FC<RejectionMessageModalProps> = ({
  isOpen,
  onClose,
  rejectionFeedback,
  claimTitle,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={true}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <FlagIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            Claim Rejected
          </h2>
          {claimTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              "{claimTitle}"
            </p>
          )}
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
            Feedback from moderators:
          </h3>
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed whitespace-pre-wrap">
            {rejectionFeedback}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            You can review the feedback above and submit a new claim if needed. 
            If you believe this rejection was made in error, please contact support.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            variant="primary" 
            onClick={onClose} 
            className='rounded-full'
          >
            Understood
          </Button>
        </div>
      </div>
    </Modal>
  )
}


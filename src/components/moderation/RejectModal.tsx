'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { CheckmarkIcon } from '@/components/ui/Icons'
import { useClaimsStore } from '@/store/claimsStore'

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  claimId?: string
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  claimId,
}) => {
  const { rejectClaim } = useClaimsStore()
  const [reason, setReason] = useState('Evidence Is Misleading And Sourced From A Discredited Article.')
  const [customMessage, setCustomMessage] = useState('This Evidence Does Not Meet Our Source Credibility Standards.')
  const [addToLog, setAddToLog] = useState(true)
  const [notifyUser, setNotifyUser] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!claimId) {
      onConfirm()
      return
    }

    setIsProcessing(true)
    try {
      const rejectReason = reason || customMessage
      const result = await rejectClaim(claimId, rejectReason)
      if (result.success) {
        onConfirm()
      } else {
        console.error('Failed to reject claim:', result.error)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error rejecting claim:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={true}
    >
      <div className="space-y-4">
        <div className="flex flex-col font-semibold text-2xl items-center justify-center py-4">
          <span className="text-gray-900 dark:text-gray-100">Are You Sure You Want To</span>
          <div className="text-red-600 dark:text-red-400 font-semibold">Reject This Content?</div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 items-center font-medium text-lg">This action will:</p>
        <ul className="space-y-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl text-sm">
          <li className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <CheckmarkIcon />
            </div>
            <span className="text-gray-700 dark:text-gray-300"><span className='font-medium'>Remove </span>the evidence from the claim</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <CheckmarkIcon />
            </div>
            <span className="text-gray-700 dark:text-gray-300">Add an entry to the violation log</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <CheckmarkIcon />
            </div>
            <span className="text-gray-700 dark:text-gray-300">Save this action in the moderation history</span>
          </li>
        </ul>

        <div className="space-y-2">
          <label className="block text-gray-700 dark:text-gray-300 font-medium ">
            Reason for rejection (required):
          </label>
          <textarea
            maxLength={100}
            rows={2}
            placeholder="Enter your reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addToLog}
              onChange={(e) => setAddToLog(e.target.checked)}
              className="w-4 h-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 rounded accent-green-600 dark:accent-green-400"
            />
            <span className="text-gray-700 dark:text-gray-300">Add to moderation log</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="w-4 h-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 rounded accent-green-600 dark:accent-green-400"
            />
            <span className="text-gray-700 dark:text-gray-300">Notify user with this message</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-gray-700 dark:text-gray-300 font-medium">
            Optional custom message:
          </label>
          <textarea
            maxLength={100}
            rows={2}
            placeholder="Enter your custom message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col justify-end space-y-3 pt-4">
          <Button 
            variant="danger" 
            onClick={handleConfirm} 
            className='rounded-full'
            disabled={isProcessing || !reason.trim()}
          >
            {isProcessing ? 'Processing...' : 'Reject and Remove'}
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


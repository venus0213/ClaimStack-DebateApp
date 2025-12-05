'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FlagIcon, QuestionMarkIcon } from '@/components/ui/Icons'
import { ApproveModal } from './ApproveModal'
import { RejectModal } from './RejectModal'
import { EscalateModal } from './EscalateModal'
import { MediaDisplay } from './MediaDisplay'

export interface ModerationItem {
  id: string
  type: 'claim' | 'evidence'
  user: string
  date: string
  title: string
  flaggedBy: number
  reason: string
  link?: string
  status: 'pending' | 'reviewed'
  // Extended fields for detailed modal
  claimId?: string
  submittedDate?: string
  ipAddress?: string
  platform?: string
  userStrikeHistory?: string
  votesFor?: number
  votesAgainst?: number
  flagTimestamps?: Array<{ date: string; user: string }>
  // File information
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  // External link information
  url?: string
  // Claim content
  description?: string
  forSummary?: string
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: ModerationItem | null
  onApprove: () => void
  onReject: () => void
  onEscalate?: () => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  onEscalate,
}) => {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)

  if (!item) return null

  const handleApproveClick = () => {
    setIsApproveModalOpen(true)
  }

  const handleApproveConfirm = () => {
    setIsApproveModalOpen(false)
    onApprove()
  }

  const handleRejectClick = () => {
    setIsRejectModalOpen(true)
  }

  const handleRejectConfirm = () => {
    setIsRejectModalOpen(false)
    onReject()
  }

  const handleEscalateClick = () => {
    setIsEscalateModalOpen(true)
  }

  const handleEscalateConfirm = () => {
    setIsEscalateModalOpen(false)
    if (onEscalate) {
      onEscalate()
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl2"
        showCloseButton={false}
      >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-6">
        {/* Left Section: Claim Content */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-[#030303] dark:text-gray-100 mb-5">Claim Content</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{item.user}</span>
              <span>{item.date}</span>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 leading-tight">
              {item.title}
            </h3>
            {item.description && (
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.description}
              </div>
            )}
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <FlagIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span>Flagged by: <strong className="text-[#030303] dark:text-gray-100">{item.flaggedBy} users</strong></span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <QuestionMarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span>Reasons: <strong className="text-[#030303] dark:text-gray-100">{item.reason}</strong></span>
              </div>
            </div>
            
            {/* File and URL Display */}
            <MediaDisplay
              fileUrl={item.fileUrl}
              fileName={item.fileName}
              fileSize={item.fileSize}
              fileType={item.fileType}
              url={item.url}
              link={item.link}
              title={item.title}
            />
          </div>
        </div>
        
        {/* Right Section: Metadata */}
        <div className="space-y-5 border-l border-gray-200 dark:border-gray-700 pl-8">
          <h2 className="text-xl font-semibold text-[#030303] dark:text-gray-100 mb-5">Metadata</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Claim ID:</span>
              <span className="ml-2 font-medium text-[#030303] dark:text-gray-100">{item.claimId || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
              <span className="ml-2 font-medium text-[#030303] dark:text-gray-100">{item.submittedDate || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400 block mb-2">AI Summary:</span>
              {item.forSummary ? (
                <p className="text-sm text-[#030303] dark:text-gray-200">{item.forSummary}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No AI summary available</p>
              )}
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">User Strike History:</span>
              <span className="ml-2 font-medium text-[#030303] dark:text-gray-100">{item.userStrikeHistory || 'No prior violations'}</span>
            </div>
            
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Votes:</span>
              <span className="ml-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{item.votesFor || 0} For</span>
                <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
                <span className="font-medium text-red-600 dark:text-red-400">{item.votesAgainst || 0} Against</span>
              </span>
            </div>
            
            {item.flagTimestamps && item.flagTimestamps.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-2">Flag Timestamps:</span>
                <ul className="space-y-1 ml-4">
                  {item.flagTimestamps.map((flag, index) => (
                    <li key={index} className="text-[#030303] dark:text-gray-200">
                      - {flag.date} ({flag.user})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              size="baseFull"
              onClick={handleApproveClick}
              className="w-full"
            >
              Approve and publish
            </Button>
            
            <Button
              variant="danger"
              size="baseFull"
              onClick={handleRejectClick}
              className="w-full"
            >
              Reject and log violation
            </Button>
            
            <Button
              variant="outline"
              size="baseFull"
              onClick={handleEscalateClick}
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Escalate to legal
            </Button>
          </div>
        </div>
      </div>
    </Modal>

    <ApproveModal
      isOpen={isApproveModalOpen}
      onClose={() => setIsApproveModalOpen(false)}
      onConfirm={handleApproveConfirm}
      claimId={item.claimId}
    />

    <RejectModal
      isOpen={isRejectModalOpen}
      onClose={() => setIsRejectModalOpen(false)}
      onConfirm={handleRejectConfirm}
      claimId={item.claimId}
    />

    <EscalateModal
      isOpen={isEscalateModalOpen}
      onClose={() => setIsEscalateModalOpen(false)}
      onConfirm={handleEscalateConfirm}
    />
    </>
  )
}


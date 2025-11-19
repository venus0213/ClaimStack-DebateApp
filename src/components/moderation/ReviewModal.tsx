'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FlagIcon, QuestionMarkIcon, LinkIcon } from '@/components/ui/Icons'
import { ApproveModal } from './ApproveModal'
import { RejectModal } from './RejectModal'
import { EscalateModal } from './EscalateModal'

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
  const [fileError, setFileError] = useState(false)

  // Reset file error when item changes
  useEffect(() => {
    setFileError(false)
  }, [item?.id])

  // Helper function to determine file category
  const getFileCategory = (fileType?: string, fileName?: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
    // Check MIME type first
    if (fileType) {
      const type = fileType.toLowerCase()
      if (type.startsWith('image/')) return 'image'
      if (type.startsWith('video/')) return 'video'
      if (type.startsWith('audio/')) return 'audio'
      if (type.includes('pdf') || type.includes('document') || type.includes('word') || 
          type.includes('excel') || type.includes('powerpoint') || type.includes('text') ||
          type.includes('msword') || type.includes('spreadsheet') || type.includes('presentation')) {
        return 'document'
      }
    }
    
    // Fallback to file extension if MIME type is not available
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      if (!extension) return 'other'
      
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv']
      const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
      const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp']
      
      if (imageExtensions.includes(extension)) return 'image'
      if (videoExtensions.includes(extension)) return 'video'
      if (audioExtensions.includes(extension)) return 'audio'
      if (documentExtensions.includes(extension)) return 'document'
    }
    
    return 'other'
  }

  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

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
        size="xl"
        showCloseButton={false}
      >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-6">
        {/* Left Section: Claim Content */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-[#030303] mb-5">Claim Content</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{item.user}</span>
              <span>{item.date}</span>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-600 leading-tight">
              {item.title}
            </h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <FlagIcon className="w-4 h-4 text-gray-600" />
                <span>Flagged by: <strong className="text-[#030303]">{item.flaggedBy} users</strong></span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <QuestionMarkIcon className="w-4 h-4 text-gray-600" />
                <span>Reasons: <strong className="text-[#030303]">{item.reason}</strong></span>
              </div>
            </div>
            
            {/* File Display */}
            {item.fileUrl ? (
              (() => {
                const fileCategory = getFileCategory(item.fileType, item.fileName)
                
                if (fileCategory === 'image' && !fileError) {
                  return (
                    <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mt-4">
                      <img
                        src={item.fileUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={() => setFileError(true)}
                      />
                    </div>
                  )
                }
                
                if (fileCategory === 'video' && !fileError) {
                  return (
                    <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mt-4">
                      <video
                        src={item.fileUrl}
                        controls
                        className="w-full h-full object-contain"
                        onError={() => setFileError(true)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )
                }
                
                if (fileCategory === 'audio' && !fileError) {
                  return (
                    <div className="w-full bg-gray-200 rounded-lg p-4 mt-4">
                      <audio
                        src={item.fileUrl}
                        controls
                        className="w-full"
                        onError={() => setFileError(true)}
                      >
                        Your browser does not support the audio tag.
                      </audio>
                      {item.fileName && (
                        <p className="text-sm text-gray-600 mt-2 text-center">{item.fileName}</p>
                      )}
                    </div>
                  )
                }
                
                // Document or other file types
                return (
                  <div className="w-full bg-gray-200 rounded-lg p-6 mt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {fileCategory === 'document' ? (
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      <div className="text-center">
                        {item.fileName && (
                          <p className="text-sm font-medium text-gray-700 mb-1">{item.fileName}</p>
                        )}
                        {item.fileType && (
                          <p className="text-xs text-gray-500 mb-2">{item.fileType}</p>
                        )}
                        {item.fileSize && (
                          <p className="text-xs text-gray-500 mb-3">{formatFileSize(item.fileSize)}</p>
                        )}
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download File
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mt-4">
                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {item.link && (
              <div className="text-gray-600 flex items-center space-x-2 text-sm pt-2">
                <LinkIcon className="w-4 h-4" />
                <span className="break-all">Link:</span>
                <div className=" text-blue-600">
                {item.link}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section: Metadata */}
        <div className="space-y-5 border-l border-gray-200 pl-8">
          <h2 className="text-xl font-semibold text-[#030303] mb-5">Metadata</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-600">Claim ID:</span>
              <span className="ml-2 font-medium text-[#030303]">{item.claimId || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Submitted:</span>
              <span className="ml-2 font-medium text-[#030303]">{item.submittedDate || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600">IP Address:</span>
              <span className="ml-2 font-medium text-[#030303]">{item.ipAddress || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Platform:</span>
              <span className="ml-2 font-medium text-[#030303]">{item.platform || 'N/A'}</span>
            </div>
            
            <div>
              <span className="text-gray-600">User Strike History:</span>
              <span className="ml-2 font-medium text-[#030303]">{item.userStrikeHistory || 'No prior violations'}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Total Votes:</span>
              <span className="ml-2">
                <span className="font-medium text-blue-600">{item.votesFor || 0} For</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-medium text-red-600">{item.votesAgainst || 0} Against</span>
              </span>
            </div>
            
            {item.flagTimestamps && item.flagTimestamps.length > 0 && (
              <div>
                <span className="text-gray-600 block mb-2">Flag Timestamps:</span>
                <ul className="space-y-1 ml-4">
                  {item.flagTimestamps.map((flag, index) => (
                    <li key={index} className="text-[#030303]">
                      - {flag.date} ({flag.user})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-6 mt-6 border-t border-gray-200">
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


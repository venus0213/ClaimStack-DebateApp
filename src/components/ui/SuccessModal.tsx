'use client'

import React from 'react'
import Image from 'next/image'
import { Modal } from './Modal'
import { Button } from './Button'

export interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  type?: 'claim' | 'evidence' | 'perspective'
  title?: string
  subtitle?: string
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type = 'claim',
  title,
  subtitle,
}) => {
  const defaultTitle = type === 'claim' 
    ? 'Claim Submitted Successfully!' 
    : type === 'evidence'
    ? 'Evidence Submitted!'
    : type === 'perspective'
    ? 'Perspective Submitted!'
    : ''
  
  const defaultSubtitle = type === 'claim'
    ? ' It will be reviewed by our team and published shortly.'
    : type === 'evidence'
    ? 'Your evidence has been submitted and is now visible to others.'
    : type === 'perspective'
    ? 'Your perspective has been submitted and is now visible to others.'
    : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showCloseButton={false}
      size="sm"
    >
      <div className="text-center py-5 px-6">
        {/* Dotted border container */}
        <div className="mb-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <Image
                src="/icons/successIcon.png"
                alt="Success"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {title || defaultTitle}
          </h2>

          {/* Subtitle */}
          <p className="text-lg font-normal text-gray-600 dark:text-gray-400">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Done Button - Black button as shown in images */}
        <Button
          variant="primary"
          onClick={onClose}
          className="w-full rounded-full bg-[#030303] hover:bg-gray-800 text-white"
        >
          Done
        </Button>
      </div>
    </Modal>
  )
}


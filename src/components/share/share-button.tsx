'use client'

import { useState } from 'react'
import { ShareModal } from './share-modal'

interface ShareButtonProps {
  calculationId: string
  orgSlug: string
  shareCode?: string | null
  shareExpiresAt?: Date | null
  sharePassword?: string | null
  shareIsActive?: boolean
  onUpdate?: () => void
  variant?: 'icon' | 'button'
  className?: string
}

export function ShareButton({
  calculationId,
  orgSlug,
  shareCode,
  shareExpiresAt,
  sharePassword,
  shareIsActive = true,
  onUpdate,
  variant = 'button',
  className = '',
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleClose = () => setShowModal(false)
  const handleUpdate = () => {
    onUpdate?.()
  }

  const hasActiveLink = shareCode && shareIsActive

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`p-2 rounded-md hover:bg-gray-100 ${className}`}
          title={hasActiveLink ? 'Hantera delningslank' : 'Skapa delningslank'}
        >
          <svg
            className={`w-5 h-5 ${hasActiveLink ? 'text-blue-600' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
        {showModal && (
          <ShareModal
            calculationId={calculationId}
            orgSlug={orgSlug}
            existingShareCode={shareCode}
            existingExpiresAt={shareExpiresAt}
            hasPassword={!!sharePassword}
            isActive={shareIsActive}
            onClose={handleClose}
            onUpdate={handleUpdate}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${
          hasActiveLink
            ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {hasActiveLink ? 'Delad' : 'Dela'}
      </button>
      {showModal && (
        <ShareModal
          calculationId={calculationId}
          orgSlug={orgSlug}
          existingShareCode={shareCode}
          existingExpiresAt={shareExpiresAt}
          hasPassword={!!sharePassword}
          isActive={shareIsActive}
          onClose={handleClose}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}

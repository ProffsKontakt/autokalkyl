'use client'

import { useState, useEffect, useRef } from 'react'
import { generateShareLink, deactivateShareLink, regenerateShareLink, getViewStats } from '@/actions/share'
import type { ViewStats } from '@/lib/share/types'

interface ShareModalProps {
  calculationId: string
  orgSlug: string
  existingShareCode?: string | null
  existingExpiresAt?: Date | null
  hasPassword?: boolean
  isActive?: boolean
  onClose: () => void
  onUpdate?: () => void  // Called when link settings change
}

export function ShareModal({
  calculationId,
  orgSlug,
  existingShareCode,
  existingExpiresAt,
  hasPassword,
  isActive = true,
  onClose,
  onUpdate,
}: ShareModalProps) {
  // State
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingShareCode ? `https://${orgSlug}.kalkyla.se/${existingShareCode}` : null
  )
  const [expiresAt, setExpiresAt] = useState<string>(
    existingExpiresAt ? new Date(existingExpiresAt).toISOString().split('T')[0] : ''
  )
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [linkActive, setLinkActive] = useState(isActive)
  const [viewStats, setViewStats] = useState<ViewStats | null>(null)

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)

  // Load view stats
  useEffect(() => {
    if (existingShareCode) {
      getViewStats(calculationId).then((result) => {
        if (result.data) setViewStats(result.data)
      })
    }
  }, [calculationId, existingShareCode])

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Handle Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Generate or update share link
  async function handleGenerateLink() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateShareLink(calculationId, {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        password: password || null,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.shareUrl) {
        setShareUrl(result.shareUrl)
        setLinkActive(true)
        onUpdate?.()
      }
    } catch {
      setError('Nagot gick fel')
    }
    setLoading(false)
  }

  // Deactivate link
  async function handleDeactivate() {
    if (!confirm('Ar du saker? Lanken kommer sluta fungera.')) return
    setLoading(true)
    setError(null)
    try {
      const result = await deactivateShareLink(calculationId)
      if (result.error) {
        setError(result.error)
      } else {
        setLinkActive(false)
        onUpdate?.()
      }
    } catch {
      setError('Nagot gick fel')
    }
    setLoading(false)
  }

  // Regenerate link (new code)
  async function handleRegenerate() {
    if (!confirm('Ar du saker? Den gamla lanken kommer sluta fungera.')) return
    setLoading(true)
    setError(null)
    try {
      const result = await regenerateShareLink(calculationId)
      if (result.error) {
        setError(result.error)
      } else if (result.shareUrl) {
        setShareUrl(result.shareUrl)
        setLinkActive(true)
        onUpdate?.()
      }
    } catch {
      setError('Nagot gick fel')
    }
    setLoading(false)
  }

  // Copy to clipboard
  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Kunde inte kopiera')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-[slideUp_0.2s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Dela kalkyl</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Share URL */}
          {shareUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delningslan
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={`flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50 ${
                    !linkActive ? 'text-gray-400 line-through' : ''
                  }`}
                />
                <button
                  onClick={handleCopy}
                  disabled={!linkActive}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? 'Kopierad!' : 'Kopiera'}
                </button>
              </div>
              {!linkActive && (
                <p className="text-sm text-red-600 mt-1">Lanken ar inaktiverad</p>
              )}
            </div>
          )}

          {/* View stats */}
          {viewStats && viewStats.totalViews > 0 && (
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <span className="font-medium">{viewStats.totalViews}</span> visningar
              {viewStats.lastViewedAt && (
                <span className="text-gray-500">
                  {' '}· Senast: {new Date(viewStats.lastViewedAt).toLocaleDateString('sv-SE')}
                </span>
              )}
            </div>
          )}

          {/* Expiration date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utgangsdatum (valfritt)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lamna tomt for att lanken aldrig ska ga ut
            </p>
          </div>

          {/* Password protection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Losenordsskydd (valfritt)
            </label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={hasPassword ? '••••••••' : 'Ange losenord'}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 py-2 border rounded-md text-gray-500 hover:bg-gray-50"
              >
                {showPassword ? 'Dolj' : 'Visa'}
              </button>
            </div>
            {hasPassword && !password && (
              <p className="text-xs text-gray-500 mt-1">
                Lanken har redan ett losenord. Ange ett nytt for att andra.
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-2">
          {!shareUrl ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Genererar...' : 'Skapa delningslank'}
            </button>
          ) : (
            <>
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sparar...' : 'Spara installningar'}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Ny lank
              </button>
              {linkActive ? (
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Inaktivera
                </button>
              ) : (
                <button
                  onClick={handleGenerateLink}
                  disabled={loading}
                  className="px-4 py-2 text-green-600 border border-green-300 rounded-md hover:bg-green-50 disabled:opacity-50"
                >
                  Aktivera
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

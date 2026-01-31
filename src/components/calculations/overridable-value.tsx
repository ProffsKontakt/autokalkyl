'use client'

import { useState, useRef, useEffect } from 'react'

interface OverridableValueProps {
  label?: string
  calculatedValue: number
  overrideValue: number | null
  onOverride: (value: number | null) => void
  formatFn?: (n: number) => string
  suffix?: string
  className?: string
}

export function OverridableValue({
  label,
  calculatedValue,
  overrideValue,
  onOverride,
  formatFn = (n) => Math.round(n).toLocaleString('sv-SE'),
  suffix = ' kr',
  className = '',
}: OverridableValueProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = overrideValue ?? calculatedValue
  const isOverridden = overrideValue !== null

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const cleaned = inputValue.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed) && parsed >= 0) {
      onOverride(parsed)
    }
    setIsEditing(false)
  }

  const handleReset = () => {
    onOverride(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {label && <span className="text-gray-600 dark:text-gray-400">{label}</span>}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-28 px-2 py-1 text-right border border-blue-500 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          placeholder={formatFn(calculatedValue)}
        />
        <span className="text-gray-500 dark:text-gray-400">{suffix}</span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 group ${className}`}>
      {label && <span className="text-gray-600 dark:text-gray-400">{label}</span>}
      <span className={isOverridden ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>
        {formatFn(displayValue)}{suffix}
      </span>
      {isOverridden && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          (raknat: {formatFn(calculatedValue)})
        </span>
      )}
      <button
        onClick={() => {
          setInputValue(displayValue.toString())
          setIsEditing(true)
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
        title="Andra varde manuellt"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      {isOverridden && (
        <button
          onClick={handleReset}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity text-xs"
          title="Aterstall till beraknat varde"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { CalculationResultsPublic } from '@/lib/share/types'

interface StickyResultsBarProps {
  results: CalculationResultsPublic
  primaryColor: string
  showThreshold?: number // pixels scrolled before showing
}

function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

export function StickyResultsBar({
  results,
  primaryColor,
  showThreshold = 400,
}: StickyResultsBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showThreshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showThreshold])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">Återbetalningstid</p>
              <p
                className="text-lg font-bold"
                style={{ color: primaryColor }}
              >
                {results.paybackYears.toFixed(1)} år
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">Årlig besparing</p>
              <p className="text-lg font-bold text-gray-900">
                {formatSek(results.totalAnnualSavings)}
              </p>
            </div>
          </div>
          <a
            href="#kontakt"
            className="px-4 py-2 rounded-md text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Kontakta mig
          </a>
        </div>
      </div>
    </div>
  )
}

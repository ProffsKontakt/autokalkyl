'use client'

import { useState, useRef, useEffect } from 'react'
import type { PublicBatteryInfo, CalculationResultsPublic } from '@/lib/share/types'

interface MobileBatteryCarouselProps {
  batteries: PublicBatteryInfo[]
  results: CalculationResultsPublic
  onSelect: (index: number) => void
  selectedIndex: number
  primaryColor: string
}

function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MobileBatteryCarousel({
  batteries,
  results,
  onSelect,
  selectedIndex,
  primaryColor,
}: MobileBatteryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Scroll to selected item
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const card = container.children[selectedIndex] as HTMLElement
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedIndex])

  // Handle swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedIndex < batteries.length - 1) {
        onSelect(selectedIndex + 1)
      } else if (diff < 0 && selectedIndex > 0) {
        onSelect(selectedIndex - 1)
      }
    }
    setTouchStart(null)
  }

  return (
    <div className="lg:hidden">
      {/* Carousel */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-4 scrollbar-hide"
      >
        {batteries.map((battery, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            className={`snap-center flex-shrink-0 w-72 bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
              selectedIndex === index
                ? 'shadow-md'
                : 'border-gray-200 opacity-80'
            }`}
            style={
              selectedIndex === index
                ? { borderColor: primaryColor }
                : undefined
            }
          >
            <div className="flex items-center gap-3 mb-3">
              {battery.brandLogoUrl && (
                <img
                  src={battery.brandLogoUrl}
                  alt={battery.brandName}
                  className="h-8 w-auto object-contain"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{battery.name}</p>
                <p className="text-sm text-gray-500">{battery.capacityKwh} kWh</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Aterbetalningstid</p>
                <p className="font-bold" style={{ color: primaryColor }}>
                  {results.paybackYears.toFixed(1)} ar
                </p>
              </div>
              <div>
                <p className="text-gray-500">Arlig besparing</p>
                <p className="font-bold text-gray-900">
                  {formatSek(results.totalAnnualSavings)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      {batteries.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {batteries.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                selectedIndex === index ? '' : 'bg-gray-300'
              }`}
              style={
                selectedIndex === index
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
              aria-label={`Visa batteri ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

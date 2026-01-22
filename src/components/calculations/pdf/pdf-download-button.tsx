'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { CalculationPDF } from './calculation-pdf'

interface PDFDownloadButtonProps {
  customerName: string
  orgName: string
  orgLogo?: string
  elomrade: string
  annualConsumptionKwh: number
  batteryName: string
  results: {
    totalIncVatSek: number
    costAfterGronTeknikSek: number
    totalAnnualSavingsSek: number
    paybackPeriodYears: number
    roi10YearPercent: number
    roi15YearPercent: number
    spotprisSavingsSek: number
    effectTariffSavingsSek: number
    gridServicesIncomeSek: number
  }
  createdAt: Date
  className?: string
}

export function PDFDownloadButton({
  customerName,
  orgName,
  orgLogo,
  elomrade,
  annualConsumptionKwh,
  batteryName,
  results,
  createdAt,
  className = '',
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <CalculationPDF
          customerName={customerName}
          orgName={orgName}
          orgLogo={orgLogo}
          elomrade={elomrade}
          annualConsumptionKwh={annualConsumptionKwh}
          batteryName={batteryName}
          results={results}
          createdAt={createdAt}
        />
      ).toBlob()

      const filename = `batterikalkyl-${customerName.toLowerCase().replace(/\s+/g, '-')}-${createdAt.toISOString().split('T')[0]}.pdf`
      saveAs(blob, filename)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Kunde inte skapa PDF. Försök igen.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Skapar PDF...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ladda ner PDF
        </>
      )}
    </button>
  )
}

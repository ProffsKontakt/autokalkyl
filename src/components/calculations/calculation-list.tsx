'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteCalculation } from '@/actions/calculations'
import { useState } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { ShareButton } from '@/components/share/share-button'
import { LinkStatusBadge } from '@/components/share/link-status-badge'
import { Calculator, Plus, Eye, Trash2, MapPin, Battery, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Calculation {
  id: string
  customerName: string
  elomrade: string
  status: 'DRAFT' | 'COMPLETE' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
  batteryName: string | null
  organizationName?: string
  // Share link data
  shareCode: string | null
  shareExpiresAt: Date | null
  sharePassword: string | null
  shareIsActive: boolean
  orgSlug: string
  viewCount: number
}

interface CalculationListProps {
  calculations: Calculation[]
  showOrg?: boolean
}

export function CalculationList({ calculations, showOrg = false }: CalculationListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { calculationId: currentWizardId, reset: resetWizard } = useCalculationWizardStore()

  const handleNewCalculation = () => {
    // Always reset the wizard store when starting a new calculation
    resetWizard()
    router.push('/dashboard/calculations/new')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kalkyl?')) return

    setDeletingId(id)
    const result = await deleteCalculation(id)
    if (result.error) {
      alert(result.error)
    } else {
      // Clear wizard store if we deleted the calculation that was loaded
      if (currentWizardId === id) {
        resetWizard()
      }
      router.refresh()
    }
    setDeletingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg">
            Utkast
          </span>
        )
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
            Klar
          </span>
        )
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg">
            Arkiverad
          </span>
        )
      default:
        return null
    }
  }

  if (calculations.length === 0) {
    return (
      <div className="text-center py-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center">
          <Calculator className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inga kalkyler</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Skapa din första kalkyl för att komma igång med att beräkna batteribesparing.
        </p>
        <div className="mt-8">
          <Button onClick={handleNewCalculation} variant="gradient">
            <Plus className="w-4 h-4" />
            Ny kalkyl
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kund
              </th>
              {showOrg && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Organisation
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Batteri
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Elområde
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Delning
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Uppdaterad
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {calculations.map((calc) => (
              <tr key={calc.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/calculations/${calc.id}`}
                    className="flex items-center gap-3 group/link"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {calc.customerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                      {calc.customerName}
                    </span>
                  </Link>
                </td>
                {showOrg && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {calc.organizationName || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Battery className="w-4 h-4 text-slate-400" />
                    {calc.batteryName || 'Inget valt'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {calc.elomrade}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(calc.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <LinkStatusBadge
                    isShared={!!calc.shareCode}
                    isActive={calc.shareIsActive}
                    expiresAt={calc.shareExpiresAt}
                    viewCount={calc.viewCount}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {new Date(calc.updatedAt).toLocaleDateString('sv-SE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end items-center gap-1">
                    <ShareButton
                      calculationId={calc.id}
                      orgSlug={calc.orgSlug}
                      shareCode={calc.shareCode}
                      shareExpiresAt={calc.shareExpiresAt}
                      sharePassword={calc.sharePassword}
                      shareIsActive={calc.shareIsActive}
                      variant="icon"
                      onUpdate={() => router.refresh()}
                    />
                    <Link
                      href={`/dashboard/calculations/${calc.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                      title="Visa"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {calc.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleDelete(calc.id)}
                        disabled={deletingId === calc.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        {calculations.map((calc) => (
          <Link
            key={calc.id}
            href={`/dashboard/calculations/${calc.id}`}
            className="block p-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {calc.customerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {calc.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      {calc.batteryName || 'Inget batteri'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {calc.elomrade}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(calc.status)}
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

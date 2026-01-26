'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { updateLeadStatus } from '@/actions/leads'
import type { PropertyType, InterestType, LeadStatus, Elomrade } from '@prisma/client'

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  propertyType: PropertyType
  postalCode: string
  elomrade: Elomrade
  interestType: InterestType
  status: LeadStatus
  matchedCompaniesCount: number
  createdAt: Date
}

interface LeadsTableProps {
  leads: Lead[]
}

const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  MATCHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CONTACTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'Ny',
  MATCHED: 'Matchad',
  CONTACTED: 'Kontaktad',
  CONVERTED: 'Konverterad',
  CLOSED: 'Stängd',
}

const interestLabels: Record<InterestType, string> = {
  BATTERY: 'Batteri',
  SOLAR: 'Solceller',
  BOTH: 'Båda',
}

const propertyLabels: Record<PropertyType, string> = {
  VILLA: 'Villa',
  BOSTADSRATT: 'Bostadsrätt',
  LAGENHET: 'Lägenhet',
  FORETAG: 'Företag',
}

export function LeadsTable({ leads: initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.postalCode.includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const result = await updateLeadStatus(leadId, newStatus)
    if (result.success) {
      setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
    }
  }

  const exportToCsv = () => {
    const headers = ['Namn', 'E-post', 'Telefon', 'Postnummer', 'Elområde', 'Intresse', 'Status', 'Matchade', 'Skapad']
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || '',
      lead.postalCode,
      lead.elomrade,
      interestLabels[lead.interestType],
      statusLabels[lead.status],
      lead.matchedCompaniesCount.toString(),
      format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm'),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'ALL')}
              className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="ALL">Alla status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Sök namn, e-post, postnummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm w-64"
          />
        </div>
        <button
          onClick={exportToCsv}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Exportera CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Kontakt
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Plats
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Intresse
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Matchade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Skapad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredLeads.map((lead) => (
              <>
                <tr
                  key={lead.id}
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ChevronDownIcon
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedId === lead.id ? 'rotate-180' : ''
                        }`}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">{lead.postalCode}</div>
                      <div className="text-gray-500 dark:text-gray-400">{lead.elomrade}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {interestLabels[lead.interestType]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleStatusChange(lead.id, e.target.value as LeadStatus)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {lead.matchedCompaniesCount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(lead.createdAt), 'd MMM HH:mm', { locale: sv })}
                    </span>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr key={`${lead.id}-expanded`}>
                    <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-slate-700/30">
                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {lead.postalCode} ({lead.elomrade}) - {propertyLabels[lead.propertyType]}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Inga leads hittades
          </div>
        )}
      </div>
    </div>
  )
}

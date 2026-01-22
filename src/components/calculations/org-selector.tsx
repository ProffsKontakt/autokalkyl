'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Organization {
  id: string
  name: string
  slug: string
}

interface OrgSelectorProps {
  organizations: Organization[]
}

export function OrgSelector({ organizations }: OrgSelectorProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filteredOrgs = organizations.filter(
    org =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (orgId: string) => {
    router.push(`/dashboard/calculations/new?orgId=${orgId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Välj organisation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Som Super Admin, välj vilken organisation du vill skapa kalkylen för
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Sök organisation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Organization list */}
      {filteredOrgs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">
            Inga organisationer hittades
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {org.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {org.slug}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

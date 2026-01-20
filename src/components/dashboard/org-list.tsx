import type { OrgStats } from '@/actions/dashboard'
import Link from 'next/link'

interface Props {
  orgs: OrgStats[]
}

export function OrgList({ orgs }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Organisationer</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisation</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kalkyler</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Anvandare</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Visningar</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Typ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <Link href={`/admin/organizations/${org.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {org.name}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{org.slug}</p>
                </td>
                <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{org.calculationCount}</td>
                <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{org.userCount}</td>
                <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{org.totalViews}</td>
                <td className="px-6 py-4 text-right">
                  {org.isProffsKontaktAffiliated ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ProffsKontakt
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      Fristaende
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

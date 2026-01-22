import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrganization } from '@/actions/organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Check, X, Palette, ExternalLink } from 'lucide-react';

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization, error } = await getOrganization(id);

  if (error || !organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{organization.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Organisationsdetaljer och användare
            </p>
          </div>
        </div>
        <Link href={`/admin/organizations/${id}/edit`}>
          <Button variant="gradient">Redigera</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grunduppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Slug:
              </span>
              <p className="font-medium text-slate-900 dark:text-white mt-1">
                <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-sm">
                  {organization.slug}
                </code>
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500 dark:text-slate-400">ProffsKontakt:</span>
              <p className="font-medium mt-1">
                {organization.isProffsKontaktAffiliated ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    Ja
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                    Nej
                  </span>
                )}
              </p>
            </div>
            {organization.isProffsKontaktAffiliated && organization.installerFixedCut && (
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Installatorns arvode:</span>
                <p className="font-medium text-slate-900 dark:text-white mt-1">
                  {String(organization.installerFixedCut)} SEK
                </p>
              </div>
            )}
            {organization.isProffsKontaktAffiliated && organization.marginAlertThreshold && (
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Marginal-varningsgräns:</span>
                <p className="font-medium text-slate-900 dark:text-white mt-1">
                  {String(organization.marginAlertThreshold)} SEK
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Varumärke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Primärfärg:</span>
              <div
                className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                style={{ backgroundColor: organization.primaryColor }}
              />
              <span className="font-mono text-sm text-slate-900 dark:text-white">{organization.primaryColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Sekundärfärg:</span>
              <div
                className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                style={{ backgroundColor: organization.secondaryColor }}
              />
              <span className="font-mono text-sm text-slate-900 dark:text-white">{organization.secondaryColor}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Användare ({organization.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organization.users.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Inga användare ännu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase py-3 pr-4">Namn</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase py-3 pr-4">E-post</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase py-3 pr-4">Roll</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {organization.users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                      <td className="py-3 pr-4 text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            Aktiv
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <X className="w-3.5 h-3.5" />
                            Inaktiv
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

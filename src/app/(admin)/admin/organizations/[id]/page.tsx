import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrganization } from '@/actions/organizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
        <Link href={`/admin/organizations/${id}/edit`}>
          <Button>Redigera</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grunduppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Slug:</span>
              <p className="font-medium">{organization.slug}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ProffsKontakt:</span>
              <p className="font-medium">
                {organization.isProffsKontaktAffiliated ? 'Ja' : 'Nej'}
              </p>
            </div>
            {organization.isProffsKontaktAffiliated && organization.partnerCutPercent && (
              <div>
                <span className="text-sm text-gray-500">Partner-provision:</span>
                <p className="font-medium">{String(organization.partnerCutPercent)}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Varumarke</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Primarfarg:</span>
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: organization.primaryColor }}
              />
              <span className="font-mono text-sm">{organization.primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sekundarfarg:</span>
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: organization.secondaryColor }}
              />
              <span className="font-mono text-sm">{organization.secondaryColor}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anvandare ({organization.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organization.users.length === 0 ? (
            <p className="text-gray-500">Inga anvandare annu</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Namn</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">E-post</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Roll</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organization.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-2">{user.name}</td>
                    <td className="py-2 text-gray-500">{user.email}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2">
                      {user.isActive ? (
                        <span className="text-green-600">Aktiv</span>
                      ) : (
                        <span className="text-red-600">Inaktiv</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

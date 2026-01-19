import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getOrganization } from '@/actions/organizations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OrgBrandingForm } from './org-branding-form';
import { ROLES, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Installningar - Kalkyla.se',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Only Org Admin can access settings (Super Admin uses admin panel)
  if (role !== ROLES.ORG_ADMIN) {
    redirect('/dashboard');
  }

  if (!session.user.orgId) {
    redirect('/dashboard');
  }

  const { organization, error } = await getOrganization(session.user.orgId);

  if (error || !organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Organisationsinstallningar</h1>

      <Card>
        <CardHeader>
          <CardTitle>Grunduppgifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-gray-500">Organisationsnamn</span>
            <p className="font-medium">{organization.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Slug (URL)</span>
            <p className="font-medium">{organization.slug}</p>
            <p className="text-xs text-gray-400">
              Dina delade kalkyler visas pa: kalkyla.se/{organization.slug}/...
            </p>
          </div>
          {organization.isProffsKontaktAffiliated && (
            <div>
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                ProffsKontakt-affilierad
              </span>
              {organization.partnerCutPercent && (
                <p className="text-xs text-gray-500 mt-1">
                  Partner-provision: {organization.partnerCutPercent.toString()}%
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Varumarke</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgBrandingForm
            organizationId={organization.id}
            defaultValues={{
              logoUrl: organization.logoUrl || '',
              primaryColor: organization.primaryColor,
              secondaryColor: organization.secondaryColor,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisation-statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{organization.users?.length || 0}</p>
              <p className="text-sm text-gray-500">Anvandare</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Kalkyler</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Visningar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

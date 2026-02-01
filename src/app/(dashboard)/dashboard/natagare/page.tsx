import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getGlobalNatagare, getOrgNatagare } from '@/actions/natagare';
import { NatagareList } from '@/components/natagare/natagare-list';
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NatagarePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.NATAGARE_VIEW)) {
    redirect('/dashboard');
  }

  // Super Admin uses dedicated config page
  if (role === ROLES.SUPER_ADMIN) {
    redirect('/dashboard/admin/natagare');
  }

  // Fetch global approved natagare (visible to all)
  const { natagare: globalNatagare, error } = await getGlobalNatagare();
  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Fel: {error}
        </div>
      </div>
    );
  }

  // Org Admin also sees their org's pending natagare
  let orgNatagare: typeof globalNatagare = [];
  if (role === ROLES.ORG_ADMIN) {
    const orgResult = await getOrgNatagare();
    orgNatagare = orgResult.natagare || [];
  }

  // Combine global and org natagare
  const allNatagare = [...(globalNatagare || []), ...orgNatagare];

  // Org Admin can request new natagare
  const canRequest = hasPermission(role, PERMISSIONS.NATAGARE_REQUEST);
  // Closer has no actions (view-only)
  const showActions = role !== ROLES.CLOSER;

  // Convert Decimal types to numbers for client component
  const natagareData = allNatagare.map((n) => ({
    id: n.id,
    name: n.name,
    dayRateSekKw: Number(n.dayRateSekKw),
    nightRateSekKw: Number(n.nightRateSekKw),
    dayStartHour: n.dayStartHour,
    dayEndHour: n.dayEndHour,
    isDefault: n.isDefault,
    isActive: n.isActive,
    approvalStatus: n.approvalStatus,
    globalScope: n.globalScope,
  }));

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Natagare</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {role === ROLES.CLOSER
              ? 'Tillgangliga natagare for kalkyler'
              : 'Se och begaer nya natagare'}
          </p>
        </div>
        {canRequest && (
          <Link href="/dashboard/natagare/new">
            <Button>Begaer ny natagare</Button>
          </Link>
        )}
      </header>

      <NatagareList natagare={natagareData} userRole={role} showActions={showActions} />
    </div>
  );
}

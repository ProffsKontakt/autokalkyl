import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getNatagare } from '@/actions/natagare';
import { NatagareList } from '@/components/natagare/natagare-list';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NatagarePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.NATAGARE_VIEW)) {
    redirect('/dashboard');
  }

  const { natagare, error } = await getNatagare();
  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Fel: {error}
        </div>
      </div>
    );
  }

  const canCreate = hasPermission(role, PERMISSIONS.NATAGARE_CREATE);

  // Convert Decimal types to numbers for client component
  const natagareData = (natagare || []).map((n) => ({
    id: n.id,
    name: n.name,
    dayRateSekKw: Number(n.dayRateSekKw),
    nightRateSekKw: Number(n.nightRateSekKw),
    dayStartHour: n.dayStartHour,
    dayEndHour: n.dayEndHour,
    isDefault: n.isDefault,
    isActive: n.isActive,
  }));

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nätägare</h1>
          <p className="text-gray-600 mt-1">
            Hantera effekttariffer för dina nätoperatörer
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/natagare/new">
            <Button>Lägg till nätägare</Button>
          </Link>
        )}
      </header>

      <NatagareList natagare={natagareData} userRole={role} />
    </div>
  );
}

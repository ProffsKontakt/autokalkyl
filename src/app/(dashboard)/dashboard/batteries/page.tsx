import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { getBatteryBrands } from '@/actions/batteries';
import { BatteryList } from '@/components/batteries/battery-list';
import { Button } from '@/components/ui/button';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Batterier - Kalkyla.se',
};

export default async function BatteriesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Check view permission
  if (!hasPermission(role, PERMISSIONS.BATTERY_VIEW)) {
    redirect('/dashboard');
  }

  const { brands, error } = await getBatteryBrands();
  const canCreate = hasPermission(role, PERMISSIONS.BATTERY_CREATE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batterier</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hantera batterivarumärken och konfigurationer för dina kalkyler.
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/batteries/brands/new">
            <Button>Lägg till varumärke</Button>
          </Link>
        )}
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      ) : (
        <BatteryList brands={brands || []} userRole={role} />
      )}
    </div>
  );
}

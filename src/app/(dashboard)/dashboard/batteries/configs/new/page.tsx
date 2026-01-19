import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getBatteryBrands } from '@/actions/batteries';
import { BatteryConfigForm } from '@/components/batteries/battery-config-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Ny batterikonfiguration - Kalkyla.se',
};

interface NewBatteryConfigPageProps {
  searchParams: Promise<{ brandId?: string }>;
}

export default async function NewBatteryConfigPage({
  searchParams,
}: NewBatteryConfigPageProps) {
  const { brandId } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Check create permission
  if (!hasPermission(role, PERMISSIONS.BATTERY_CREATE)) {
    redirect('/dashboard/batteries');
  }

  // Get brands for dropdown
  const { brands, error } = await getBatteryBrands();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        {error}
      </div>
    );
  }

  // Check if there are any brands
  if (!brands || brands.length === 0) {
    redirect('/dashboard/batteries/brands/new');
  }

  // Format brands for the form
  const brandOptions = brands.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ny batterikonfiguration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Skapa en ny batterikonfiguration med alla tekniska specifikationer.
        </p>
      </div>

      <BatteryConfigForm brands={brandOptions} brandId={brandId} />
    </div>
  );
}

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getBatteryConfig, getBatteryBrands } from '@/actions/batteries';
import { BatteryConfigForm } from '@/components/batteries/battery-config-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Redigera batterikonfiguration - Kalkyla.se',
};

interface EditBatteryConfigPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBatteryConfigPage({
  params,
}: EditBatteryConfigPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Check edit permission
  if (!hasPermission(role, PERMISSIONS.BATTERY_EDIT)) {
    redirect('/dashboard/batteries');
  }

  // Fetch config and brands in parallel
  const [configResult, brandsResult] = await Promise.all([
    getBatteryConfig(id),
    getBatteryBrands(),
  ]);

  if (configResult.error || !configResult.config) {
    notFound();
  }

  if (brandsResult.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        {brandsResult.error}
      </div>
    );
  }

  const config = configResult.config;
  const brandOptions = (brandsResult.brands || []).map((b) => ({ id: b.id, name: b.name }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Redigera batterikonfiguration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Uppdatera specifikationer för {config.name}.
        </p>
      </div>

      <BatteryConfigForm config={config} brands={brandOptions} />
    </div>
  );
}

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getBatteryBrand } from '@/actions/batteries';
import { BatteryBrandForm } from '@/components/batteries/battery-brand-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Redigera varumarke - Kalkyla.se',
};

interface EditBatteryBrandPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBatteryBrandPage({
  params,
}: EditBatteryBrandPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Check edit permission
  if (!hasPermission(role, PERMISSIONS.BATTERY_EDIT)) {
    redirect('/dashboard/batteries');
  }

  const { brand, error } = await getBatteryBrand(id);

  if (error || !brand) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Redigera varumarke</h1>
        <p className="text-sm text-gray-500 mt-1">
          Uppdatera information om {brand.name}.
        </p>
      </div>

      <BatteryBrandForm brand={brand} />
    </div>
  );
}

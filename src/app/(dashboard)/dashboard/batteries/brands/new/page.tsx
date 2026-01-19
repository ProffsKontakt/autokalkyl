import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { BatteryBrandForm } from '@/components/batteries/battery-brand-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Nytt varumarke - Kalkyla.se',
};

export default async function NewBatteryBrandPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Check create permission
  if (!hasPermission(role, PERMISSIONS.BATTERY_CREATE)) {
    redirect('/dashboard/batteries');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nytt batterivarumarke</h1>
        <p className="text-sm text-gray-500 mt-1">
          Skapa ett nytt varumarke for att kunna lagga till batterikonfigurationer.
        </p>
      </div>

      <BatteryBrandForm />
    </div>
  );
}

import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getQuarterlyPrices, fetchTodaysPrices, recalculateQuarterlyAverages } from '@/actions/electricity';
import { QuarterlyPrices } from '@/components/electricity/quarterly-prices';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

export default async function ElectricityPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.ELPRICES_VIEW)) {
    redirect('/dashboard');
  }

  const { prices, error } = await getQuarterlyPrices();
  const canManage = hasPermission(role, PERMISSIONS.ELPRICES_MANAGE);

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Elpriser</h1>
          <p className="text-gray-600">Kvartalsgenomsnitt per elomrade</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <form action={async () => {
              'use server';
              await fetchTodaysPrices();
              revalidatePath('/dashboard/electricity');
            }}>
              <Button type="submit" variant="outline">
                Hamta dagens priser
              </Button>
            </form>
            <form action={async () => {
              'use server';
              await recalculateQuarterlyAverages();
              revalidatePath('/dashboard/electricity');
            }}>
              <Button type="submit" variant="outline">
                Rakna om kvartal
              </Button>
            </form>
          </div>
        )}
      </header>

      {error ? (
        <div className="text-red-600">Fel: {error}</div>
      ) : (
        <>
          <QuarterlyPrices prices={prices!} />
          <div className="mt-6 text-sm text-gray-500">
            <p>Priser hamtas fran Nord Pool via mgrey.se.</p>
            <p>Dag = 06:00-22:00, Natt = 22:00-06:00</p>
          </div>
        </>
      )}
    </div>
  );
}

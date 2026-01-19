import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Kalkyler - Kalkyla.se',
};

export default async function CalculationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Placeholder - will be implemented in Phase 2
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalkyler</h1>
        <Link href="/dashboard/calculations/new">
          <Button>Ny kalkyl</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">
            Du har inga kalkyler annu.
          </p>
          <p className="text-sm text-gray-400">
            Skapa din forsta ROI-kalkyl for att komma igang!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

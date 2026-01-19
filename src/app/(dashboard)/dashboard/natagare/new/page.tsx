import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { NatagareForm } from '@/components/natagare/natagare-form';
import Link from 'next/link';

export default async function NewNatagarePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.NATAGARE_CREATE)) {
    redirect('/dashboard/natagare');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/natagare"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Tillbaka till natagare
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lagg till natagare</h1>
        <p className="text-gray-600 mt-1">
          Skapa en ny natagare med effekttariffer
        </p>
      </header>

      <NatagareForm />
    </div>
  );
}

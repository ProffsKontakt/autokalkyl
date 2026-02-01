import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions';
import { NatagareForm } from '@/components/natagare/natagare-form';
import { NatagareRequestForm } from '@/components/natagare/natagare-request-form';
import Link from 'next/link';

export default async function NewNatagarePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  // Closer cannot create natagare at all - redirect to view
  if (role === ROLES.CLOSER) {
    redirect('/dashboard/natagare');
  }

  // Org Admin can only request (needs NATAGARE_CREATE which they still have)
  // Super Admin redirects to admin config page
  if (role === ROLES.SUPER_ADMIN) {
    redirect('/dashboard/admin/natagare');
  }

  // Org Admin: check for NATAGARE_CREATE or NATAGARE_REQUEST permission
  if (!hasPermission(role, PERMISSIONS.NATAGARE_CREATE) && !hasPermission(role, PERMISSIONS.NATAGARE_REQUEST)) {
    redirect('/dashboard/natagare');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/natagare"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          &larr; Tillbaka till natagare
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Begaer ny natagare</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Begaer en ny natagare foer din organisation
        </p>
      </header>

      <NatagareRequestForm />
    </div>
  );
}

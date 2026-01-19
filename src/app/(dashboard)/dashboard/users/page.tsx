import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { getUsers } from '@/actions/users';
import { UserList } from '@/components/users/user-list';
import { Button } from '@/components/ui/button';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Anvandare - Kalkyla.se',
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  const canCreateOrgAdmin = hasPermission(role, PERMISSIONS.USER_CREATE_ORG_ADMIN);
  const canCreateCloser = hasPermission(role, PERMISSIONS.USER_CREATE_CLOSER);

  if (!canCreateOrgAdmin && !canCreateCloser) {
    redirect('/dashboard');
  }

  const { users, error } = await getUsers();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anvandare</h1>
        {(canCreateOrgAdmin || canCreateCloser) && (
          <Link href="/dashboard/users/new">
            <Button>Skapa anvandare</Button>
          </Link>
        )}
      </div>

      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <UserList users={users || []} currentUserRole={role} />
      )}
    </div>
  );
}

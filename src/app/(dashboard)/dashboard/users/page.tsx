import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { getUsers } from '@/actions/users';
import { UserList } from '@/components/users/user-list';
import { Button } from '@/components/ui/button';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { Users, Plus } from 'lucide-react';

export const metadata = {
  title: 'Användare - Kalkyla.se',
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
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Användare</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {users?.length || 0} användare totalt
            </p>
          </div>
        </div>
        {(canCreateOrgAdmin || canCreateCloser) && (
          <Link href="/dashboard/users/new">
            <Button variant="gradient">
              <Plus className="w-4 h-4" />
              Skapa användare
            </Button>
          </Link>
        )}
      </div>

      {error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : (
        <UserList users={users || []} currentUserRole={role} />
      )}
    </div>
  );
}

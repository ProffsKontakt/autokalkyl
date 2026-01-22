import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { UserForm } from '@/components/users/user-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Skapa användare - Kalkyla.se',
};

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  const canCreateOrgAdmin = hasPermission(role, PERMISSIONS.USER_CREATE_ORG_ADMIN);
  const canCreateCloser = hasPermission(role, PERMISSIONS.USER_CREATE_CLOSER);

  if (!canCreateOrgAdmin && !canCreateCloser) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Skapa ny användare</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Lägg till en ny användare i systemet
          </p>
        </div>
      </div>
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6">
        <UserForm
          currentUserRole={role}
          currentUserOrgId={session.user.orgId}
        />
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { UserForm } from '@/components/users/user-form';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Skapa anvandare - Kalkyla.se',
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Skapa ny anvandare</h1>
      <UserForm
        currentUserRole={role}
        currentUserOrgId={session.user.orgId}
      />
    </div>
  );
}

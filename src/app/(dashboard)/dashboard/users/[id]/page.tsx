import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getUser } from '@/actions/users';
import { UserForm } from '@/components/users/user-form';
import { hasPermission, PERMISSIONS, ROLES, Role } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Redigera användare - Kalkyla.se',
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;

  if (!hasPermission(role, PERMISSIONS.USER_EDIT)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const { user, error } = await getUser(id);

  if (error || !user) {
    notFound();
  }

  // Prevent editing Super Admin users
  if (user.role === ROLES.SUPER_ADMIN) {
    redirect('/dashboard/users');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Redigera {user.name}
      </h1>
      <UserForm
        user={user}
        currentUserRole={role}
        currentUserOrgId={session.user.orgId}
      />
    </div>
  );
}

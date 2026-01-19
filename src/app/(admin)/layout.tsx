import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { DashboardNav } from '@/components/layout/dashboard-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only Super Admin can access admin routes
  if (!hasPermission(session.user.role as Role, PERMISSIONS.ORG_VIEW_ALL)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNav user={session.user} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

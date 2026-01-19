import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                Kalkyla.se Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin/organizations" className="text-gray-600 hover:text-gray-900">
                Organisationer
              </a>
              <span className="text-sm text-gray-500">
                {session.user.name}
              </span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

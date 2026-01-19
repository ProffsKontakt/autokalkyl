'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth';
import { ROLES } from '@/lib/auth/permissions';

interface DashboardNavProps {
  user: {
    name: string;
    role: string;
    orgSlug: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter();
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const isOrgAdmin = user.role === ROLES.ORG_ADMIN;

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
              Kalkyla.se
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
              >
                Oversikt
              </Link>
              {(isSuperAdmin || isOrgAdmin) && (
                <Link
                  href="/dashboard/users"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
                >
                  Anvandare
                </Link>
              )}
              {isOrgAdmin && (
                <Link
                  href="/dashboard/settings"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
                >
                  Installningar
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  href="/admin/organizations"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {user.name} ({user.role})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logga ut
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

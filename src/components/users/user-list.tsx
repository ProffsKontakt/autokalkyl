'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { deactivateUser } from '@/actions/users';
import { ROLES, Role } from '@/lib/auth/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  organization: {
    name: string;
    slug: string;
  } | null;
}

interface UserListProps {
  users: User[];
  currentUserRole: Role;
}

export function UserList({ users }: UserListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDeactivate = (userId: string, userName: string) => {
    if (!confirm(`Ar du saker pa att du vill inaktivera ${userName}?`)) return;

    startTransition(async () => {
      const result = await deactivateUser(userId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-gray-500">
          Inga anvandare att visa.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Namn
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              E-post
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Roll
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Organisation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Atgarder
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.role === ROLES.SUPER_ADMIN
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === ROLES.ORG_ADMIN
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.organization?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.isActive ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Aktiv
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Inaktiv
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Redigera
                </Link>
                {user.isActive && user.role !== ROLES.SUPER_ADMIN && (
                  <button
                    onClick={() => handleDeactivate(user.id, user.name)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-800"
                  >
                    Inaktivera
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

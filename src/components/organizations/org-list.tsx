import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Organization {
  id: string;
  name: string;
  slug: string;
  isProffsKontaktAffiliated: boolean;
  _count: {
    users: number;
  };
}

interface OrgListProps {
  organizations: Organization[];
}

export function OrgList({ organizations }: OrgListProps) {
  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-gray-500">
          Inga organisationer annu. Skapa den forsta!
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
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              ProffsKontakt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Anvandare
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Atgarder
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {organizations.map((org) => (
            <tr key={org.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{org.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{org.slug}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {org.isProffsKontaktAffiliated ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Ja
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    Nej
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {org._count.users}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Visa
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

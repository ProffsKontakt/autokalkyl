import { getOrganizations } from '@/actions/organizations';
import { OrgList } from '@/components/organizations/org-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Organisationer - Kalkyla.se Admin',
};

export default async function OrganizationsPage() {
  const { organizations, error } = await getOrganizations();

  if (error) {
    return (
      <div className="text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organisationer</h1>
        <Link href="/admin/organizations/new">
          <Button>Skapa organisation</Button>
        </Link>
      </div>

      <OrgList organizations={organizations || []} />
    </div>
  );
}

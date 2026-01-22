import { getOrganizations } from '@/actions/organizations';
import { OrgList } from '@/components/organizations/org-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';

export const metadata = {
  title: 'Organisationer - Kalkyla.se Admin',
};

export default async function OrganizationsPage() {
  const { organizations, error } = await getOrganizations();

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organisationer</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {organizations?.length || 0} organisationer totalt
            </p>
          </div>
        </div>
        <Link href="/admin/organizations/new">
          <Button variant="gradient">
            <Plus className="w-4 h-4" />
            Skapa organisation
          </Button>
        </Link>
      </div>

      <OrgList organizations={organizations || []} />
    </div>
  );
}

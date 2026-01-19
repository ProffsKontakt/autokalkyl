import { OrgForm } from '@/components/organizations/org-form';

export const metadata = {
  title: 'Skapa organisation - Kalkyla.se Admin',
};

export default function NewOrganizationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Skapa ny organisation</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <OrgForm />
      </div>
    </div>
  );
}

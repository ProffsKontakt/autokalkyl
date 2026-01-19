import { notFound } from 'next/navigation';
import { getOrganization } from '@/actions/organizations';
import { OrgForm } from '@/components/organizations/org-form';

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization, error } = await getOrganization(id);

  if (error || !organization) {
    notFound();
  }

  // Convert Decimal types to numbers for the form
  const formOrganization = {
    ...organization,
    partnerCutPercent: organization.partnerCutPercent ? Number(organization.partnerCutPercent) : null,
    marginAlertThreshold: organization.marginAlertThreshold ? Number(organization.marginAlertThreshold) : null,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Redigera {organization.name}
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <OrgForm organization={formOrganization} />
      </div>
    </div>
  );
}

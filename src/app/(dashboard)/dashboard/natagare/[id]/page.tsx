import { auth } from '@/lib/auth/auth';
import { redirect, notFound } from 'next/navigation';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { getNatagareById } from '@/actions/natagare';
import { NatagareForm } from '@/components/natagare/natagare-form';
import Link from 'next/link';

interface EditNatagarePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNatagarePage({ params }: EditNatagarePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.NATAGARE_EDIT)) {
    redirect('/dashboard/natagare');
  }

  const { id } = await params;
  const { natagare, error } = await getNatagareById(id);

  if (error || !natagare) {
    notFound();
  }

  // Convert Decimal types to numbers for client component
  const natagareData = {
    id: natagare.id,
    name: natagare.name,
    dayRateSekKw: Number(natagare.dayRateSekKw),
    nightRateSekKw: Number(natagare.nightRateSekKw),
    dayStartHour: natagare.dayStartHour,
    dayEndHour: natagare.dayEndHour,
    isDefault: natagare.isDefault,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/natagare"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Tillbaka till natagare
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Redigera natagare</h1>
        <p className="text-gray-600 mt-1">
          Uppdatera tariffer och tidsintervall for {natagare.name}
        </p>
      </header>

      <NatagareForm natagare={natagareData} />
    </div>
  );
}

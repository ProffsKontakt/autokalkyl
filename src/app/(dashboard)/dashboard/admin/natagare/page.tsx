import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ROLES, Role } from '@/lib/auth/permissions';
import { getGlobalNatagare, getPendingNatagare } from '@/actions/natagare';
import { NatagareConfigPanel } from '@/components/natagare/natagare-config-panel';
import { NatagareDuplicateBanner } from '@/components/natagare/natagare-duplicate-banner';

export default async function AdminNatagarePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Super Admin only
  const role = session.user.role as Role;
  if (role !== ROLES.SUPER_ADMIN) {
    redirect('/dashboard');
  }

  // Fetch global natagare and pending/duplicate natagare
  const [globalResult, pendingResult] = await Promise.all([
    getGlobalNatagare(),
    getPendingNatagare(),
  ]);

  if (globalResult.error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Fel: {globalResult.error}
        </div>
      </div>
    );
  }

  // All natagare for Super Admin: global + pending + duplicates
  const allNatagare = [
    ...(globalResult.natagare || []),
    ...(pendingResult.natagare || []),
  ];

  // Count duplicates (approvalStatus = 'DUPLICATE_REVIEW')
  const duplicateCount = (pendingResult.natagare || []).filter(
    (n) => n.approvalStatus === 'DUPLICATE_REVIEW'
  ).length;

  // Count pending
  const pendingCount = (pendingResult.natagare || []).filter(
    (n) => n.approvalStatus === 'PENDING'
  ).length;

  // Convert Decimal types to numbers for client component
  const natagareData = allNatagare.map((n) => ({
    id: n.id,
    name: n.name,
    dayRateSekKw: Number(n.dayRateSekKw),
    nightRateSekKw: Number(n.nightRateSekKw),
    dayStartHour: n.dayStartHour,
    dayEndHour: n.dayEndHour,
    peakCalculationMethod: n.peakCalculationMethod,
    nightDiscountPercent: n.nightDiscountPercent ? Number(n.nightDiscountPercent) : null,
    peakNightStartHour: n.peakNightStartHour,
    peakNightEndHour: n.peakNightEndHour,
    globalScope: n.globalScope,
    approvalStatus: n.approvalStatus,
    // Phase 14: New fields (NATA-12, NATA-13)
    overforingsavgiftOreKwh: n.overforingsavgiftOreKwh ? Number(n.overforingsavgiftOreKwh) : null,
    highLoadStartHour: n.highLoadStartHour,
    highLoadEndHour: n.highLoadEndHour,
    isWinterOnlyHighLoad: n.isWinterOnlyHighLoad,
  }));

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Natagare (Admin)
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Konfigurera globala natagare, effektberakningsmetoder och nattrabatter
        </p>
      </header>

      {duplicateCount > 0 && (
        <NatagareDuplicateBanner duplicateCount={duplicateCount} />
      )}

      <NatagareConfigPanel natagare={natagareData} pendingCount={pendingCount} />
    </div>
  );
}

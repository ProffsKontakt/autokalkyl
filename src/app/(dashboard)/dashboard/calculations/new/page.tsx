import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions'
import { createTenantClient } from '@/lib/db/tenant-client'
import { prisma } from '@/lib/db/client'
import { CalculationWizard } from '@/components/calculations/wizard/calculation-wizard'
import { OrgSelector } from '@/components/calculations/org-selector'

export const metadata = {
  title: 'Ny kalkyl - Kalkyla.se',
}

interface PageProps {
  searchParams: Promise<{ orgId?: string }>
}

export default async function NewCalculationPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_CREATE)) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  // Determine which orgId to use
  let orgId: string | null = null

  if (isSuperAdmin) {
    // Super Admin can select an organization
    if (params.orgId) {
      // Verify the org exists
      const org = await prisma.organization.findUnique({
        where: { id: params.orgId },
        select: { id: true },
      })
      if (org) {
        orgId = org.id
      }
    }

    // If no valid orgId selected, show org selector
    if (!orgId) {
      const organizations = await prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      })

      return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
          <OrgSelector organizations={organizations} />
        </div>
      )
    }
  } else {
    // Regular users use their own org
    if (!session.user.orgId) {
      redirect('/dashboard')
    }
    orgId = session.user.orgId
  }

  // Fetch natagare list for the org (including effect tariff rates for calculations)
  const tenantClient = createTenantClient(orgId)
  const natagare = await tenantClient.natagare.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  // Fetch battery configs for the org (including all fields needed for calculation engine)
  const batteries = await tenantClient.batteryConfig.findMany({
    where: { isActive: true },
    include: { brand: true },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  })

  // Fetch latest quarterly prices (for calculation preview)
  const latestQuarter = await prisma.electricityPriceQuarterly.findFirst({
    orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
  })

  let quarterlyPrices: Record<string, { avgDayPriceOre: number; avgNightPriceOre: number }> | null = null
  if (latestQuarter) {
    const prices = await prisma.electricityPriceQuarterly.findMany({
      where: { year: latestQuarter.year, quarter: latestQuarter.quarter },
    })
    quarterlyPrices = {}
    for (const p of prices) {
      quarterlyPrices[p.elomrade] = {
        avgDayPriceOre: Number(p.avgDayPriceOre),
        avgNightPriceOre: Number(p.avgNightPriceOre),
      }
    }
  }

  // Fetch org settings for margin calculation
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { isProffsKontaktAffiliated: true, installerFixedCut: true },
  })

  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg h-[calc(100vh-8rem)]">
      <CalculationWizard
        natagareList={natagare.map(n => ({
          id: n.id,
          name: n.name,
          dayRateSekKw: Number(n.dayRateSekKw),
          nightRateSekKw: Number(n.nightRateSekKw),
        }))}
        batteryList={batteries.map(b => ({
          id: b.id,
          name: b.name,
          brandName: b.brand.name,
          capacityKwh: Number(b.capacityKwh),
          maxDischargeKw: Number(b.maxDischargeKw),
          maxChargeKw: Number(b.maxChargeKw),
          chargeEfficiency: Number(b.chargeEfficiency),
          dischargeEfficiency: Number(b.dischargeEfficiency),
          costPrice: Number(b.costPrice),
        }))}
        quarterlyPrices={quarterlyPrices}
        orgSettings={org ? {
          isProffsKontaktAffiliated: org.isProffsKontaktAffiliated,
          installerFixedCut: org.installerFixedCut ? Number(org.installerFixedCut) : null,
        } : undefined}
        orgId={isSuperAdmin ? orgId : undefined}
      />
    </div>
  )
}

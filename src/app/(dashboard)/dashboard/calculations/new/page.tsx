import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions'
import { createTenantClient } from '@/lib/db/tenant-client'
import { prisma } from '@/lib/db/client'
import { CalculationWizard } from '@/components/calculations/wizard/calculation-wizard'

export const metadata = {
  title: 'Ny kalkyl - Kalkyla.se',
}

export default async function NewCalculationPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_CREATE)) {
    redirect('/dashboard')
  }

  // Fetch natagare list for the org (including effect tariff rates for calculations)
  const tenantClient = createTenantClient(session.user.orgId!)
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
  const org = role === 'SUPER_ADMIN'
    ? null
    : await prisma.organization.findUnique({
        where: { id: session.user.orgId! },
        select: { isProffsKontaktAffiliated: true, installerFixedCut: true },
      })

  return (
    <div className="bg-white rounded-lg shadow h-[calc(100vh-8rem)]">
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
      />
    </div>
  )
}

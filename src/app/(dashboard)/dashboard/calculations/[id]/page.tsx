import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions'
import { getCalculation } from '@/actions/calculations'
import { createTenantClient } from '@/lib/db/tenant-client'
import { prisma } from '@/lib/db/client'
import { CalculationWizard } from '@/components/calculations/wizard/calculation-wizard'
import { ShareButton } from '@/components/share/share-button'
import Link from 'next/link'

export const metadata = {
  title: 'Redigera kalkyl - Kalkyla.se',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCalculationPage({ params }: PageProps) {
  const resolvedParams = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW)) {
    redirect('/dashboard/calculations')
  }

  const result = await getCalculation(resolvedParams.id)

  if (result.error) {
    if (result.error === 'Kalkyl hittades inte' || result.error === 'Forbidden') {
      notFound()
    }
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        {result.error}
      </div>
    )
  }

  const calculation = result.calculation!

  // Fetch natagare list for the org
  const orgId = calculation.orgId || session.user.orgId
  const tenantClient = createTenantClient(orgId!)
  const natagare = await tenantClient.natagare.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  // Fetch battery configs for the org
  const batteries = await tenantClient.batteryConfig.findMany({
    where: { isActive: true },
    include: { brand: true },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  })

  // Fetch latest quarterly prices
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

  // Fetch org settings
  const org = await prisma.organization.findUnique({
    where: { id: orgId! },
    select: { isProffsKontaktAffiliated: true, installerFixedCut: true },
  })

  // Transform calculation data for wizard initial state
  const initialData = {
    calculationId: calculation.id,
    customerName: calculation.customerName,
    postalCode: calculation.postalCode,
    elomrade: calculation.elomrade,
    natagareId: calculation.natagareId,
    annualConsumptionKwh: calculation.annualConsumptionKwh,
    consumptionProfile: calculation.consumptionProfile as { data: number[][] },
    batteries: calculation.batteries.map(b => ({
      configId: b.batteryConfigId,
      totalPriceExVat: b.totalPriceExVat,
      installationCost: b.installationCost,
    })),
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dashboard/calculations"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tillbaka till kalkyler
        </Link>
        <div className="flex items-center gap-3">
          <ShareButton
            calculationId={calculation.id}
            orgSlug={calculation.organization.slug}
            shareCode={calculation.shareCode}
            shareExpiresAt={calculation.shareExpiresAt}
            sharePassword={calculation.sharePassword}
            shareIsActive={calculation.shareIsActive}
          />
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            calculation.status === 'DRAFT'
              ? 'bg-yellow-100 text-yellow-800'
              : calculation.status === 'COMPLETE'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {calculation.status === 'DRAFT' ? 'Utkast' : calculation.status === 'COMPLETE' ? 'Klar' : 'Arkiverad'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow h-full">
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
          initialData={initialData}
        />
      </div>
    </div>
  )
}

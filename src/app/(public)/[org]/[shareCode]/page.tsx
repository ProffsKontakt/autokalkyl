import { getPublicCalculation, recordView } from '@/actions/share'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/client'
import { PublicHeader } from '@/components/public/public-header'
import { PublicGreeting } from '@/components/public/public-greeting'
import { PublicFooter } from '@/components/public/public-footer'
import { PasswordGate } from '@/components/public/password-gate'
import { InteractivePublicView } from '@/components/public/interactive-public-view'
import { PublicAnalytics } from '@/components/public/public-analytics'

interface PageProps {
  params: Promise<{
    org: string
    shareCode: string
  }>
  searchParams: Promise<{
    pwd?: string
  }>
}

export default async function PublicCalculationPage({ params, searchParams }: PageProps) {
  const { org, shareCode } = await params
  const { pwd } = await searchParams

  // Fetch public calculation data
  const result = await getPublicCalculation(org, shareCode, pwd)

  // Password required - show gate
  if (result.passwordRequired) {
    return (
      <PasswordGate
        orgSlug={org}
        shareCode={shareCode}
        error={undefined}
      />
    )
  }

  // Error (expired, not found, wrong password)
  if (result.error) {
    if (result.error === 'Fel lösenord') {
      return (
        <PasswordGate
          orgSlug={org}
          shareCode={shareCode}
          error={result.error}
        />
      )
    }
    notFound()
  }

  if (!result.data) {
    notFound()
  }

  const { calculation, organization, closer } = result.data

  // Record view (fire-and-forget)
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0] || headersList.get('x-real-ip')
  recordView(calculation.id, userAgent, ip)

  // Fetch quarterly prices for recalculation
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const quarterlyPrices = await prisma.electricityPriceQuarterly.findFirst({
    where: {
      elomrade: calculation.elomrade,
      year: new Date().getFullYear(),
      quarter: currentQuarter,
    },
    select: {
      avgDayPriceOre: true,
      avgNightPriceOre: true,
    },
  })

  // Get primary battery (first one)
  const primaryBattery = calculation.batteries[0]
  const results = calculation.results

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        '--primary-color': organization.primaryColor,
        '--secondary-color': organization.secondaryColor,
      } as React.CSSProperties}
    >
      <PublicHeader
        orgName={organization.name}
        logoUrl={organization.logoUrl}
        primaryColor={organization.primaryColor}
      />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <PublicGreeting
          customerName={calculation.customerName}
          closerName={closer.name}
          customGreeting={calculation.customGreeting}
        />

        {primaryBattery && results && (
          <InteractivePublicView
            calculationId={calculation.id}
            batteries={calculation.batteries}
            results={results}
            consumptionProfile={calculation.consumptionProfile}
            annualConsumptionKwh={calculation.annualConsumptionKwh}
            natagare={calculation.natagare}
            elomrade={calculation.elomrade}
            quarterlyPrices={quarterlyPrices ? {
              avgDayPriceOre: Number(quarterlyPrices.avgDayPriceOre),
              avgNightPriceOre: Number(quarterlyPrices.avgNightPriceOre),
            } : null}
            primaryColor={organization.primaryColor}
          />
        )}
      </main>

      <PublicFooter
        closerName={closer.name}
        primaryColor={organization.primaryColor}
      />

      {/* Analytics tracking */}
      <PublicAnalytics calculationId={calculation.id} orgSlug={org} />
    </div>
  )
}

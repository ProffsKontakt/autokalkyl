import { getPublicCalculation, recordView } from '@/actions/share'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { PublicHeader } from '@/components/public/public-header'
import { PublicGreeting } from '@/components/public/public-greeting'
import { PublicBatterySummary } from '@/components/public/public-battery-summary'
import { PublicResultsView } from '@/components/public/public-results-view'
import { PublicFooter } from '@/components/public/public-footer'
import { PasswordGate } from '@/components/public/password-gate'

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
    if (result.error === 'Fel losenord') {
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

  // Get primary battery (first one)
  const primaryBattery = calculation.batteries[0]
  const results = calculation.results

  return (
    <div
      className="min-h-screen"
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
          <>
            <PublicBatterySummary
              battery={primaryBattery}
              allBatteries={calculation.batteries}
              results={results}
            />

            <PublicResultsView
              results={results}
              primaryColor={organization.primaryColor}
            />
          </>
        )}
      </main>

      <PublicFooter
        closerName={closer.name}
        primaryColor={organization.primaryColor}
      />
    </div>
  )
}

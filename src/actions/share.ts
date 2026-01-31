'use server'

/**
 * Server actions for share link management.
 *
 * Provides share link generation, deactivation, public calculation fetch,
 * and view tracking with proper RBAC and tenant scoping.
 */

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/client'
import { createTenantClient } from '@/lib/db/tenant-client'
import { hasPermission, PERMISSIONS, type Role } from '@/lib/auth/permissions'
import { generateShareCode } from '@/lib/share/generate-code'
import type {
  ShareLinkSettings,
  PublicCalculationData,
  ViewStats,
  PublicBatteryInfo,
  CalculationResultsPublic,
  CalculationBreakdownPublic,
  CalculationResultsPublicWithBreakdown,
} from '@/lib/share/types'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { VAT_RATE, GRON_TEKNIK_RATE } from '@/lib/calculations/constants'
import { checkSharePasswordRateLimit, hashIp } from '@/lib/rate-limit'
import { logSecurityEvent, SecurityEventType } from '@/lib/audit/logger'

// =============================================================================
// GENERATE/UPDATE SHARE LINK (Authenticated - Closer/Admin)
// =============================================================================

/**
 * Generate or update a share link for a calculation.
 *
 * - Creates a new share code if none exists
 * - Updates share settings (expiration, password, greeting)
 * - Closers can only share their own calculations
 */
export async function generateShareLink(
  calculationId: string,
  settings: ShareLinkSettings = {}
): Promise<{ shareCode?: string; shareUrl?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Inte inloggad' }
  }

  const role = session.user.role as Role

  // Verify permission
  if (!hasPermission(role, PERMISSIONS.CALCULATION_EDIT)) {
    return { error: 'Saknar behörighet' }
  }

  // Fetch calculation to verify ownership/org
  const tenantDb = session.user.orgId
    ? createTenantClient(session.user.orgId)
    : prisma

  const calculation = await tenantDb.calculation.findUnique({
    where: { id: calculationId },
    include: { organization: { select: { slug: true } } },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte' }
  }

  // For Closer role, verify they own the calculation
  if (role === 'CLOSER' && calculation.createdBy !== session.user.id) {
    return { error: 'Du kan bara dela dina egna kalkyler' }
  }

  // Generate new share code or keep existing
  const shareCode = calculation.shareCode || generateShareCode()

  // Hash password if provided
  let passwordHash = calculation.sharePassword
  if (settings.password !== undefined) {
    passwordHash = settings.password
      ? await bcrypt.hash(settings.password, 12)
      : null
  }

  // Update calculation with share settings
  await tenantDb.calculation.update({
    where: { id: calculationId },
    data: {
      shareCode,
      shareExpiresAt: settings.expiresAt,
      sharePassword: passwordHash,
      shareCreatedAt: calculation.shareCreatedAt || new Date(),
      shareIsActive: true,
      customGreeting:
        settings.customGreeting !== undefined
          ? settings.customGreeting
          : calculation.customGreeting,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkyla.se'
  const shareUrl = `${baseUrl}/${calculation.organization.slug}/${shareCode}`

  return { shareCode, shareUrl }
}

// =============================================================================
// DEACTIVATE SHARE LINK
// =============================================================================

/**
 * Deactivate a share link without deleting it.
 * The link can be reactivated later by calling generateShareLink again.
 */
export async function deactivateShareLink(
  calculationId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Inte inloggad' }
  }

  const role = session.user.role as Role

  if (!hasPermission(role, PERMISSIONS.CALCULATION_EDIT)) {
    return { error: 'Saknar behörighet' }
  }

  const tenantDb = session.user.orgId
    ? createTenantClient(session.user.orgId)
    : prisma

  const calculation = await tenantDb.calculation.findUnique({
    where: { id: calculationId },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte' }
  }

  if (role === 'CLOSER' && calculation.createdBy !== session.user.id) {
    return { error: 'Du kan bara hantera dina egna kalkyler' }
  }

  await tenantDb.calculation.update({
    where: { id: calculationId },
    data: { shareIsActive: false },
  })

  return { success: true }
}

// =============================================================================
// REGENERATE SHARE LINK (New code, invalidates old)
// =============================================================================

/**
 * Regenerate a share link with a new code.
 * Invalidates the old link - anyone with the old URL will no longer have access.
 */
export async function regenerateShareLink(
  calculationId: string
): Promise<{ shareCode?: string; shareUrl?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Inte inloggad' }
  }

  const role = session.user.role as Role

  if (!hasPermission(role, PERMISSIONS.CALCULATION_EDIT)) {
    return { error: 'Saknar behörighet' }
  }

  const tenantDb = session.user.orgId
    ? createTenantClient(session.user.orgId)
    : prisma

  const calculation = await tenantDb.calculation.findUnique({
    where: { id: calculationId },
    include: { organization: { select: { slug: true } } },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte' }
  }

  if (role === 'CLOSER' && calculation.createdBy !== session.user.id) {
    return { error: 'Du kan bara hantera dina egna kalkyler' }
  }

  const newShareCode = generateShareCode()

  await tenantDb.calculation.update({
    where: { id: calculationId },
    data: {
      shareCode: newShareCode,
      shareCreatedAt: new Date(),
      shareIsActive: true,
      // Keep existing password and expiry settings
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkyla.se'
  const shareUrl = `${baseUrl}/${calculation.organization.slug}/${newShareCode}`

  return { shareCode: newShareCode, shareUrl }
}

// =============================================================================
// GET PUBLIC CALCULATION (Unauthenticated - for public view)
// =============================================================================

/**
 * Build public breakdown data from calculation results and stored inputs.
 * Filters out sensitive business data (TRANS-04).
 */
function buildPublicBreakdown(
  results: Record<string, number | undefined>,
  inputs: {
    capacityKwh: number
    efficiency: number
    cyclesPerDay: number
    spreadOre: number
    currentPeakKw: number
    peakShavingPercent: number
    tariffRateSekKw: number
    elomrade: string
    isEmaldoBattery: boolean
    batteryCapacityKw: number
    postCampaignRatePerKwYear: number
  }
): CalculationBreakdownPublic {
  const targetPeakShaving = inputs.currentPeakKw * (inputs.peakShavingPercent / 100)
  const actualPeakShaving = results.peakShavingKw ?? 0

  return {
    spotpris: {
      capacityKwh: inputs.capacityKwh,
      cyclesPerDay: inputs.cyclesPerDay,
      efficiency: inputs.efficiency,
      spreadOre: inputs.spreadOre,
      annualSavingsSek: results.spotprisSavingsSek ?? 0,
    },
    effekt: {
      currentPeakKw: inputs.currentPeakKw,
      peakShavingPercent: inputs.peakShavingPercent,
      actualPeakShavingKw: actualPeakShaving,
      newPeakKw: inputs.currentPeakKw - actualPeakShaving,
      tariffRateSekKw: inputs.tariffRateSekKw,
      annualSavingsSek: results.effectTariffSavingsSek ?? 0,
      isConstrained: actualPeakShaving < targetPeakShaving * 0.99, // 1% tolerance
    },
    stodtjanster: {
      elomrade: inputs.elomrade,
      isEmaldoBattery: inputs.isEmaldoBattery,
      batteryCapacityKw: inputs.batteryCapacityKw,
      guaranteedMonthlySek: inputs.isEmaldoBattery && results.stodtjansterGuaranteedSek
        ? results.stodtjansterGuaranteedSek / 36  // 36-month campaign
        : undefined,
      guaranteedAnnualSek: inputs.isEmaldoBattery && results.stodtjansterGuaranteedSek
        ? results.stodtjansterGuaranteedSek / 3   // 3 years
        : undefined,
      postCampaignRatePerKwYear: inputs.postCampaignRatePerKwYear,
      postCampaignAnnualSek: results.stodtjansterPostCampaignSek
        ? results.stodtjansterPostCampaignSek / 7  // 10 years - 3 campaign years
        : undefined,
      displayedAnnualSek: results.gridServicesIncomeSek ?? 0,
    },
  }
  // NOTE: marginSek, costPriceTotal, installerCut are NOT included (TRANS-04)
}

/**
 * Get a calculation by share code for public view.
 *
 * This is called from the public view page (no authentication required).
 * Returns only public-safe data - no margin, cost price, or installer cut.
 */
export async function getPublicCalculation(
  orgSlug: string,
  shareCode: string,
  password?: string,
  clientIp?: string
): Promise<{
  data?: PublicCalculationData
  error?: string
  passwordRequired?: boolean
  rateLimited?: boolean
}> {
  // Find calculation by org slug and share code
  const calculation = await prisma.calculation.findFirst({
    where: {
      shareCode,
      organization: { slug: orgSlug },
      status: { not: 'ARCHIVED' },
      shareIsActive: true,
    },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      natagare: {
        select: {
          name: true,
          dayRateSekKw: true,
          nightRateSekKw: true,
          dayStartHour: true,
          dayEndHour: true,
        },
      },
      batteries: {
        include: {
          batteryConfig: {
            include: {
              brand: { select: { name: true, logoUrl: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte eller är inte längre tillgänglig' }
  }

  // Check expiration
  if (calculation.shareExpiresAt && calculation.shareExpiresAt < new Date()) {
    return { error: 'Länken har gått ut. Kontakta din säljare för en ny länk.' }
  }

  // Check password if required
  if (calculation.sharePassword) {
    if (!password) {
      return { passwordRequired: true }
    }

    // Rate limit password attempts by IP
    const ipHash = clientIp ? hashIp(clientIp) : 'unknown'
    const rateLimit = checkSharePasswordRateLimit(ipHash)
    if (!rateLimit.success) {
      const minutesLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      await logSecurityEvent({
        type: SecurityEventType.SHARE_PASSWORD_RATE_LIMITED,
        ipHash,
        metadata: { shareCode, orgSlug, minutesLeft },
      })
      return {
        rateLimited: true,
        error: `För många försök. Vänta ${minutesLeft} minuter.`,
      }
    }

    const valid = await bcrypt.compare(password, calculation.sharePassword)
    if (!valid) {
      await logSecurityEvent({
        type: SecurityEventType.SHARE_PASSWORD_FAILED,
        ipHash,
        metadata: { shareCode, orgSlug },
      })
      return { error: 'Fel lösenord' }
    }
  }

  // Get closer info
  const closer = await prisma.user.findUnique({
    where: { id: calculation.createdBy },
    select: { name: true },
  })

  // Transform to public-safe data
  const batteries: PublicBatteryInfo[] = calculation.batteries.map((b) => {
    const totalExVat = Number(b.totalPriceExVat)
    const totalIncVat = totalExVat * (1 + VAT_RATE)
    const afterGronTeknik = totalIncVat * (1 - GRON_TEKNIK_RATE)

    return {
      name: b.batteryConfig.name,
      brandName: b.batteryConfig.brand.name,
      brandLogoUrl: b.batteryConfig.brand.logoUrl,
      capacityKwh: Number(b.batteryConfig.capacityKwh),
      maxDischargeKw: Number(b.batteryConfig.maxDischargeKw),
      maxChargeKw: Number(b.batteryConfig.maxChargeKw),
      chargeEfficiency: Number(b.batteryConfig.chargeEfficiency),
      dischargeEfficiency: Number(b.batteryConfig.dischargeEfficiency),
      warrantyYears: b.batteryConfig.warrantyYears,
      guaranteedCycles: b.batteryConfig.guaranteedCycles,
      degradationPerYear: Number(b.batteryConfig.degradationPerYear),
      totalPriceExVat: totalExVat,
      totalPriceIncVat: totalIncVat,
      costAfterGronTeknik: afterGronTeknik,
      // Note: costPrice, marginSek, installerCut NOT included
    }
  })

  // Extract public-safe results
  // Note: Field names from engine use *Sek, *Years, *Percent suffixes
  let resultsPublic: CalculationResultsPublicWithBreakdown | null = null
  if (calculation.results && Object.keys(calculation.results as object).length > 0) {
    const r = calculation.results as Record<string, number>
    resultsPublic = {
      totalPriceExVat: r.totalPriceExVat ?? batteries[0]?.totalPriceExVat,
      totalPriceIncVat: r.totalIncVatSek ?? batteries[0]?.totalPriceIncVat,
      costAfterGronTeknik: r.costAfterGronTeknikSek ?? batteries[0]?.costAfterGronTeknik,
      effectiveCapacityKwh: r.effectiveCapacityPerCycleKwh,
      annualEnergyKwh: r.energyFromBatteryPerYearKwh,
      spotprisSavings: r.spotprisSavingsSek,
      effectTariffSavings: r.effectTariffSavingsSek,
      gridServicesIncome: r.gridServicesIncomeSek,
      totalAnnualSavings: r.totalAnnualSavingsSek,
      paybackYears: r.paybackPeriodYears,
      roi10Year: r.roi10YearPercent,
      roi15Year: r.roi15YearPercent,
      // Exclude sensitive fields: marginSek, costPriceTotal, installerCut
    }

    // Build breakdown data for transparency (TRANS-02)
    if (batteries[0]) {
      const battery = calculation.batteries[0]
      const config = battery.batteryConfig

      // Extract input values for breakdown
      const inputs = {
        capacityKwh: Number(config.capacityKwh),
        efficiency: Number(config.chargeEfficiency) * Number(config.dischargeEfficiency),
        cyclesPerDay: r.cyclesPerDay ?? 1,
        spreadOre: r.spreadOre ?? 100,
        currentPeakKw: r.currentPeakKw ?? Number(calculation.annualConsumptionKwh) / 8760, // Estimate from annual consumption
        peakShavingPercent: r.peakShavingPercent ?? 50,
        tariffRateSekKw: Number(calculation.natagare.dayRateSekKw),
        elomrade: calculation.elomrade,
        isEmaldoBattery: config.brand.name.toLowerCase().includes('emaldo'),
        batteryCapacityKw: Number(config.maxDischargeKw),
        postCampaignRatePerKwYear: r.postCampaignRatePerKwYear ?? 500,
      }

      resultsPublic.breakdown = buildPublicBreakdown(r, inputs)
    }
  }

  return {
    data: {
      calculation: {
        id: calculation.id,
        customerName: calculation.customerName,
        elomrade: calculation.elomrade,
        annualConsumptionKwh: Number(calculation.annualConsumptionKwh),
        consumptionProfile: calculation.consumptionProfile as {
          data: number[][]
        },
        customGreeting: calculation.customGreeting,
        results: resultsPublic,
        batteries,
        natagare: {
          name: calculation.natagare.name,
          dayRateSekKw: Number(calculation.natagare.dayRateSekKw),
          nightRateSekKw: Number(calculation.natagare.nightRateSekKw),
          dayStartHour: calculation.natagare.dayStartHour,
          dayEndHour: calculation.natagare.dayEndHour,
        },
      },
      organization: calculation.organization,
      closer: {
        name: closer?.name || 'Din säljare',
      },
    },
  }
}

// =============================================================================
// VIEW TRACKING (Unauthenticated - called from public view)
// =============================================================================

/**
 * Record a view of a shared calculation.
 *
 * Called from the public view page when the calculation is accessed.
 * IP is hashed for privacy - we don't store raw IPs.
 *
 * This is fire-and-forget - errors are silently caught to avoid
 * breaking the page load.
 */
export async function recordView(
  calculationId: string,
  userAgent: string | null,
  ipAddress: string | null
): Promise<void> {
  // Hash IP for privacy (only first 16 chars of hash)
  const ipHash = ipAddress
    ? createHash('sha256').update(ipAddress).digest('hex').slice(0, 16)
    : null

  // Fire-and-forget: don't block page load
  await prisma.calculationView
    .create({
      data: {
        calculationId,
        userAgent: userAgent?.slice(0, 500) || null, // Truncate long user agents
        ipHash,
      },
    })
    .catch(() => {
      // Silently fail - view tracking shouldn't break the page
    })
}

// =============================================================================
// SAVE VARIANT (Unauthenticated - called from public view)
// =============================================================================

/**
 * Save a variant when prospect modifies consumption profile.
 *
 * Creates a record of what the prospect changed from the original calculation.
 * This allows Closers to see what prospects experimented with.
 */
export async function saveVariant(
  calculationId: string,
  consumptionProfile: number[][],
  annualConsumptionKwh: number,
  results: CalculationResultsPublic
): Promise<{ id?: string; error?: string }> {
  try {
    const variant = await prisma.calculationVariant.create({
      data: {
        calculationId,
        consumptionProfile: { data: consumptionProfile },
        annualConsumptionKwh,
        results: JSON.parse(JSON.stringify(results)),
      },
    })
    return { id: variant.id }
  } catch (error) {
    console.error('Failed to save variant:', error)
    return { error: 'Kunde inte spara varianten' }
  }
}

// =============================================================================
// GET VIEW STATS (Authenticated - for Closer dashboard)
// =============================================================================

/**
 * Get view statistics for a calculation.
 *
 * Shows total views and when the calculation was last viewed.
 * Closers can only see stats for their own calculations.
 */
export async function getViewStats(
  calculationId: string
): Promise<{ data?: ViewStats; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Inte inloggad' }
  }

  const role = session.user.role as Role

  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW)) {
    return { error: 'Saknar behörighet' }
  }

  const tenantDb = session.user.orgId
    ? createTenantClient(session.user.orgId)
    : prisma

  // Verify calculation exists and user has access
  const calculation = await tenantDb.calculation.findUnique({
    where: { id: calculationId },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte' }
  }

  if (role === 'CLOSER' && calculation.createdBy !== session.user.id) {
    return { error: 'Du kan bara se statistik för dina egna kalkyler' }
  }

  // Get view stats
  const stats = await prisma.calculationView.aggregate({
    where: { calculationId },
    _count: true,
    _max: { viewedAt: true },
  })

  return {
    data: {
      totalViews: stats._count,
      lastViewedAt: stats._max.viewedAt,
    },
  }
}

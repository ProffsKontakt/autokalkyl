'use server'

/**
 * Server actions for calculation CRUD operations.
 *
 * Provides auto-save drafts, finalization, and retrieval with proper
 * tenant scoping and RBAC.
 */

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { createTenantClient } from '@/lib/db/tenant-client'
import { triggerMarginAlert } from '@/lib/webhooks/n8n'
import { z } from 'zod'
import type { ConsumptionProfile, Elomrade } from '@/lib/calculations/types'

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const saveDraftSchema = z.object({
  calculationId: z.string().nullable(),
  customerName: z.string().min(1, 'Kundnamn krävs'),
  postalCode: z.string().optional(),
  elomrade: z.enum(['SE1', 'SE2', 'SE3', 'SE4']),
  natagareId: z.string().min(1, 'Nätägare krävs'),
  annualConsumptionKwh: z.number().min(1),
  consumptionProfile: z.object({
    data: z.array(z.array(z.number())),
  }),
  batteries: z.array(z.object({
    configId: z.string(),
    totalPriceExVat: z.number(),
    installationCost: z.number(),
  })),
  // Optional orgId for Super Admin to create calculations for any organization
  orgId: z.string().optional(),
})

export type SaveDraftInput = z.infer<typeof saveDraftSchema>

// =============================================================================
// SAVE DRAFT
// =============================================================================

/**
 * Save or update a calculation draft.
 *
 * Called by the auto-save hook every 2 seconds when form data changes.
 * Creates a new calculation if calculationId is null.
 * Super Admin can provide orgId to create calculations for any organization.
 */
export async function saveDraft(input: SaveDraftInput) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_CREATE)) {
    return { error: 'Forbidden' }
  }

  const parsed = saveDraftSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Determine orgId: Super Admin can specify, others use their own
  let effectiveOrgId: string
  if (role === ROLES.SUPER_ADMIN) {
    if (!data.orgId) {
      return { error: 'Super Admin måste välja en organisation' }
    }
    effectiveOrgId = data.orgId
  } else {
    if (!session.user.orgId) {
      return { error: 'Ingen organisation kopplad till användaren' }
    }
    effectiveOrgId = session.user.orgId
  }

  const tenantClient = createTenantClient(effectiveOrgId)

  try {
    if (data.calculationId) {
      // Update existing draft
      // For Closer, verify ownership
      if (role === 'CLOSER') {
        const existing = await tenantClient.calculation.findUnique({
          where: { id: data.calculationId },
          select: { createdBy: true },
        })
        if (!existing || existing.createdBy !== session.user.id) {
          return { error: 'Forbidden' }
        }
      }

      const updated = await tenantClient.calculation.update({
        where: { id: data.calculationId },
        data: {
          customerName: data.customerName,
          postalCode: data.postalCode || null,
          elomrade: data.elomrade as Elomrade,
          natagareId: data.natagareId,
          annualConsumptionKwh: data.annualConsumptionKwh,
          consumptionProfile: data.consumptionProfile as unknown as object,
        },
      })

      // Sync batteries (delete all and recreate for simplicity)
      await prisma.calculationBattery.deleteMany({
        where: { calculationId: data.calculationId },
      })

      if (data.batteries.length > 0) {
        await prisma.calculationBattery.createMany({
          data: data.batteries.map((b, i) => ({
            calculationId: data.calculationId!,
            batteryConfigId: b.configId,
            totalPriceExVat: b.totalPriceExVat,
            installationCost: b.installationCost,
            sortOrder: i,
          })),
        })
      }

      // Check for margin alert (fire-and-forget)
      await checkAndTriggerMarginAlert(
        updated.id,
        data,
        session.user.id,
        effectiveOrgId
      )

      return { calculationId: updated.id }
    } else {
      // Create new draft
      const created = await (tenantClient.calculation.create as (args: {
        data: Record<string, unknown>
      }) => Promise<{ id: string }>)({
        data: {
          customerName: data.customerName,
          postalCode: data.postalCode || null,
          elomrade: data.elomrade,
          natagareId: data.natagareId,
          annualConsumptionKwh: data.annualConsumptionKwh,
          consumptionProfile: data.consumptionProfile,
          createdBy: session.user.id,
          status: 'DRAFT',
        },
      })

      if (data.batteries.length > 0) {
        await prisma.calculationBattery.createMany({
          data: data.batteries.map((b, i) => ({
            calculationId: created.id,
            batteryConfigId: b.configId,
            totalPriceExVat: b.totalPriceExVat,
            installationCost: b.installationCost,
            sortOrder: i,
          })),
        })
      }

      // Check for margin alert (fire-and-forget)
      await checkAndTriggerMarginAlert(
        created.id,
        data,
        session.user.id,
        effectiveOrgId
      )

      return { calculationId: created.id }
    }
  } catch (error) {
    console.error('Save draft error:', error)
    return { error: 'Kunde inte spara utkastet' }
  }
}

// =============================================================================
// MARGIN ALERT HELPER
// =============================================================================

/**
 * Check if margin alert should be triggered for ProffsKontakt-affiliated orgs.
 *
 * Fire-and-forget: errors are logged but never thrown.
 * Only triggers for affiliated orgs when margin < threshold.
 */
async function checkAndTriggerMarginAlert(
  calculationId: string,
  data: SaveDraftInput,
  userId: string,
  orgId: string
): Promise<void> {
  // Only check if there are batteries
  if (data.batteries.length === 0) return

  try {
    // Fetch org with affiliation info
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        isProffsKontaktAffiliated: true,
        installerFixedCut: true,
        marginAlertThreshold: true,
        name: true,
        slug: true,
      },
    })

    // Only trigger for ProffsKontakt-affiliated orgs
    if (!org?.isProffsKontaktAffiliated) return

    // Get primary battery and its config
    const primaryBattery = data.batteries[0]
    const batteryConfig = await prisma.batteryConfig.findUnique({
      where: { id: primaryBattery.configId },
      select: { name: true, costPrice: true, brand: { select: { name: true } } },
    })

    if (!batteryConfig) return

    const totalPriceExVat = primaryBattery.totalPriceExVat
    const batteryCost = Number(batteryConfig.costPrice)
    const installerCut = Number(org.installerFixedCut || 0)
    const marginSek = totalPriceExVat - batteryCost - installerCut
    const threshold = Number(org.marginAlertThreshold || 24000)

    // Only trigger if margin is below threshold
    if (marginSek >= threshold) return

    // Get closer info
    const closer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    // Get current calculation for share info
    const calc = await prisma.calculation.findUnique({
      where: { id: calculationId },
      select: { shareCode: true, _count: { select: { views: true } } },
    })

    const shareUrl = calc?.shareCode
      ? `https://${org.slug}.kalkyla.se/${calc.shareCode}`
      : null

    // Fire-and-forget - don't await, just call
    triggerMarginAlert({
      eventType: 'calculation_saved',
      calculationId,
      orgId,
      orgName: org.name,
      closerId: userId,
      closerName: closer?.name || 'Okänd',
      closerEmail: closer?.email || '',
      customerName: data.customerName,
      batteryName: `${batteryConfig.brand.name} ${batteryConfig.name}`,
      totalPriceExVat,
      batteryCostPrice: batteryCost,
      installerFixedCut: installerCut,
      marginSek,
      threshold,
      shareUrl,
      createdAt: new Date().toISOString(),
      viewCount: calc?._count?.views || 0,
    })
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('[Margin Alert] Check error:', error)
  }
}

// =============================================================================
// GET CALCULATION
// =============================================================================

/**
 * Get a single calculation by ID.
 *
 * Includes related natagare and battery details.
 * Closers can only access their own calculations.
 */
export async function getCalculation(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW)) {
    return { error: 'Forbidden' }
  }

  try {
    let calculation

    if (role === 'SUPER_ADMIN') {
      calculation = await prisma.calculation.findUnique({
        where: { id },
        include: {
          natagare: true,
          batteries: {
            include: { batteryConfig: { include: { brand: true } } },
            orderBy: { sortOrder: 'asc' },
          },
          organization: { select: { id: true, name: true, slug: true } },
        },
      })
    } else {
      const tenantClient = createTenantClient(session.user.orgId!)
      calculation = await tenantClient.calculation.findUnique({
        where: { id },
        include: {
          natagare: true,
          batteries: {
            include: { batteryConfig: { include: { brand: true } } },
            orderBy: { sortOrder: 'asc' },
          },
          organization: { select: { id: true, slug: true } },
        },
      })
    }

    if (!calculation) {
      return { error: 'Kalkyl hittades inte' }
    }

    // Check ownership for Closer role
    if (role === 'CLOSER' && calculation.createdBy !== session.user.id) {
      return { error: 'Forbidden' }
    }

    // Serialize Decimal fields to numbers for JSON transport
    return {
      calculation: {
        ...calculation,
        annualConsumptionKwh: Number(calculation.annualConsumptionKwh),
        batteries: calculation.batteries.map(b => ({
          ...b,
          totalPriceExVat: Number(b.totalPriceExVat),
          installationCost: Number(b.installationCost),
          batteryConfig: {
            ...b.batteryConfig,
            capacityKwh: Number(b.batteryConfig.capacityKwh),
            maxDischargeKw: Number(b.batteryConfig.maxDischargeKw),
            maxChargeKw: Number(b.batteryConfig.maxChargeKw),
            chargeEfficiency: Number(b.batteryConfig.chargeEfficiency),
            dischargeEfficiency: Number(b.batteryConfig.dischargeEfficiency),
            warrantyYears: b.batteryConfig.warrantyYears,
            guaranteedCycles: b.batteryConfig.guaranteedCycles,
            degradationPerYear: Number(b.batteryConfig.degradationPerYear),
            costPrice: Number(b.batteryConfig.costPrice),
          },
        })),
        natagare: {
          ...calculation.natagare,
          dayRateSekKw: Number(calculation.natagare.dayRateSekKw),
          nightRateSekKw: Number(calculation.natagare.nightRateSekKw),
        },
      },
    }
  } catch (error) {
    console.error('Get calculation error:', error)
    return { error: 'Kunde inte hämta kalkyl' }
  }
}

// =============================================================================
// LIST CALCULATIONS
// =============================================================================

/**
 * List calculations for the current user/org.
 *
 * - Super Admin: sees all calculations
 * - Org Admin: sees all org calculations
 * - Closer: sees only own calculations
 */
export async function listCalculations() {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW)) {
    return { error: 'Forbidden' }
  }

  try {
    let calculations

    if (role === 'SUPER_ADMIN') {
      calculations = await prisma.calculation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          organization: { select: { name: true, slug: true } },
          batteries: {
            include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
            orderBy: { sortOrder: 'asc' },
            take: 1, // Just get first battery for list display
          },
          _count: { select: { views: true } },
        },
      })
    } else if (role === 'ORG_ADMIN') {
      const tenantClient = createTenantClient(session.user.orgId!)
      calculations = await tenantClient.calculation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          organization: { select: { slug: true } },
          batteries: {
            include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: { select: { views: true } },
        },
      })
    } else {
      // CLOSER - only own calculations
      const tenantClient = createTenantClient(session.user.orgId!)
      calculations = await tenantClient.calculation.findMany({
        where: { createdBy: session.user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          organization: { select: { slug: true } },
          batteries: {
            include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: { select: { views: true } },
        },
      })
    }

    return {
      calculations: calculations.map(c => ({
        id: c.id,
        customerName: c.customerName,
        elomrade: c.elomrade,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        batteryName: c.batteries[0]
          ? `${c.batteries[0].batteryConfig.brand.name} ${c.batteries[0].batteryConfig.name}`
          : null,
        organizationName: 'name' in (c.organization as object)
          ? (c.organization as unknown as { name: string }).name
          : undefined,
        // Share link data
        shareCode: c.shareCode,
        shareExpiresAt: c.shareExpiresAt,
        sharePassword: c.sharePassword,
        shareIsActive: c.shareIsActive,
        orgSlug: c.organization.slug,
        viewCount: c._count?.views || 0,
      })),
    }
  } catch (error) {
    console.error('List calculations error:', error)
    return { error: 'Kunde inte hämta kalkyler' }
  }
}

// =============================================================================
// FINALIZE CALCULATION
// =============================================================================

/**
 * Finalize a calculation with computed results.
 *
 * Marks the calculation as COMPLETE and stores the results JSON.
 */
export async function finalizeCalculation(id: string, results: unknown) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_FINALIZE)) {
    return { error: 'Forbidden' }
  }

  try {
    const tenantClient = role === 'SUPER_ADMIN'
      ? prisma
      : createTenantClient(session.user.orgId!)

    // Check ownership for Closer
    if (role === 'CLOSER') {
      const existing = await tenantClient.calculation.findUnique({
        where: { id },
        select: { createdBy: true },
      })
      if (!existing || existing.createdBy !== session.user.id) {
        return { error: 'Forbidden' }
      }
    }

    await tenantClient.calculation.update({
      where: { id },
      data: {
        status: 'COMPLETE',
        results: results as object,
        finalizedAt: new Date(),
      },
    })

    revalidatePath('/dashboard/calculations')
    return { success: true }
  } catch (error) {
    console.error('Finalize calculation error:', error)
    return { error: 'Kunde inte slutfora kalkyl' }
  }
}

// =============================================================================
// DELETE CALCULATION
// =============================================================================

/**
 * Soft-delete a calculation by archiving it.
 */
export async function deleteCalculation(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_DELETE)) {
    return { error: 'Forbidden' }
  }

  try {
    const tenantClient = role === 'SUPER_ADMIN'
      ? prisma
      : createTenantClient(session.user.orgId!)

    // Check ownership for Closer
    if (role === 'CLOSER') {
      const existing = await tenantClient.calculation.findUnique({
        where: { id },
        select: { createdBy: true },
      })
      if (!existing || existing.createdBy !== session.user.id) {
        return { error: 'Forbidden' }
      }
    }

    // Soft delete (archive)
    await tenantClient.calculation.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    revalidatePath('/dashboard/calculations')
    return { success: true }
  } catch (error) {
    console.error('Delete calculation error:', error)
    return { error: 'Kunde inte ta bort kalkyl' }
  }
}

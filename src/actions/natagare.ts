'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createTenantClient } from '@/lib/db/tenant-client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions';
import { ApprovalStatus } from '@prisma/client';

const natagareSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken').max(100),
  dayRateSekKw: z.number().min(0, 'Dagtariff får inte vara negativ'),
  nightRateSekKw: z.number().min(0, 'Natttariff får inte vara negativ'),
  dayStartHour: z.number().int().min(0).max(23, 'Ogiltig starttid'),
  dayEndHour: z.number().int().min(0).max(23, 'Ogiltig sluttid'),
});

export type NatagareFormData = z.infer<typeof natagareSchema>;

/**
 * Create a new natagare (grid operator) record.
 * Requires NATAGARE_CREATE permission.
 *
 * Phase 9 behavior:
 * - SUPER_ADMIN: Creates global natagare (globalScope=true, approvalStatus=APPROVED, orgId=null)
 * - ORG_ADMIN: Creates pending request (globalScope=false, approvalStatus=PENDING, requestedByOrgId=orgId)
 * - CLOSER: Cannot create (no NATAGARE_CREATE permission)
 */
export async function createNatagare(data: NatagareFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_CREATE)) {
    return { error: 'Du har inte behörighet att skapa nätägare' };
  }

  const parsed = natagareSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Super Admin creates global natagare
    if (currentRole === ROLES.SUPER_ADMIN) {
      // Check if a global natagare with this name already exists
      const existingGlobal = await prisma.natagare.findFirst({
        where: {
          name: parsed.data.name,
          globalScope: true,
        },
      });
      if (existingGlobal) {
        return { error: 'En global nätägare med detta namn finns redan' };
      }

      const natagare = await prisma.natagare.create({
        data: {
          name: parsed.data.name,
          dayRateSekKw: parsed.data.dayRateSekKw,
          nightRateSekKw: parsed.data.nightRateSekKw,
          dayStartHour: parsed.data.dayStartHour,
          dayEndHour: parsed.data.dayEndHour,
          orgId: null, // Global - no org
          globalScope: true,
          approvalStatus: ApprovalStatus.APPROVED,
          isDefault: false,
          isActive: true,
        },
      });

      revalidatePath('/dashboard/natagare');
      revalidatePath('/dashboard/admin/natagare');
      return { success: true, natagareId: natagare.id };
    }

    // ORG_ADMIN creates pending request
    const orgId = session.user.orgId;
    if (!orgId) {
      return { error: 'Organisation krävs' };
    }

    // Check if org already has a pending request with this name
    const existingPending = await prisma.natagare.findFirst({
      where: {
        name: parsed.data.name,
        requestedByOrgId: orgId,
        approvalStatus: ApprovalStatus.PENDING,
      },
    });
    if (existingPending) {
      return { error: 'En begäran om denna nätägare väntar redan på godkännande' };
    }

    const natagare = await prisma.natagare.create({
      data: {
        name: parsed.data.name,
        dayRateSekKw: parsed.data.dayRateSekKw,
        nightRateSekKw: parsed.data.nightRateSekKw,
        dayStartHour: parsed.data.dayStartHour,
        dayEndHour: parsed.data.dayEndHour,
        orgId: orgId,
        globalScope: false,
        approvalStatus: ApprovalStatus.PENDING,
        requestedByOrgId: orgId,
        isDefault: false,
        isActive: true,
      },
    });

    revalidatePath('/dashboard/natagare');
    return { success: true, natagareId: natagare.id, pending: true };
  } catch (error) {
    console.error('Failed to create natagare:', error);
    return { error: 'Kunde inte skapa nätägare' };
  }
}

/**
 * Update an existing natagare record.
 * Requires NATAGARE_EDIT permission.
 * Cannot change isDefault field.
 */
export async function updateNatagare(
  id: string,
  data: Partial<Omit<NatagareFormData, 'isDefault'>>
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_EDIT)) {
    return { error: 'Du har inte behörighet att redigera nätägare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation krävs' };
  }

  try {
    const tenantDb = createTenantClient(orgId);

    // Verify natagare exists and belongs to org
    const existing = await tenantDb.natagare.findFirst({
      where: { id },
    });
    if (!existing) {
      return { error: 'Nätägare hittades inte' };
    }

    // Build update data, excluding isDefault
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.dayRateSekKw !== undefined) updateData.dayRateSekKw = data.dayRateSekKw;
    if (data.nightRateSekKw !== undefined) updateData.nightRateSekKw = data.nightRateSekKw;
    if (data.dayStartHour !== undefined) updateData.dayStartHour = data.dayStartHour;
    if (data.dayEndHour !== undefined) updateData.dayEndHour = data.dayEndHour;

    // If name changed, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await tenantDb.natagare.findFirst({
        where: { name: data.name },
      });
      if (duplicate) {
        return { error: 'En nätägare med detta namn finns redan' };
      }
    }

    await prisma.natagare.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard/natagare');
    revalidatePath(`/dashboard/natagare/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update natagare:', error);
    return { error: 'Kunde inte uppdatera nätägare' };
  }
}

/**
 * Delete a natagare record.
 * Requires NATAGARE_DELETE permission.
 * Cannot delete default natagare (isDefault: true).
 */
export async function deleteNatagare(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_DELETE)) {
    return { error: 'Du har inte behörighet att ta bort nätägare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation krävs' };
  }

  try {
    const tenantDb = createTenantClient(orgId);

    // Verify natagare exists and belongs to org
    const existing = await tenantDb.natagare.findFirst({
      where: { id },
    });
    if (!existing) {
      return { error: 'Nätägare hittades inte' };
    }

    // Cannot delete default natagare
    if (existing.isDefault) {
      return { error: 'Förinstallda nätägare kan inte tas bort. Du kan endast ändra priserna.' };
    }

    await prisma.natagare.delete({
      where: { id },
    });

    revalidatePath('/dashboard/natagare');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete natagare:', error);
    return { error: 'Kunde inte ta bort nätägare' };
  }
}

/**
 * Get natagare available for the current user.
 * Requires NATAGARE_VIEW permission.
 *
 * Phase 9 behavior:
 * - Returns all global approved natagare (for dropdown selection)
 * - Plus org's own pending/rejected requests (for visibility)
 */
export async function getNatagare() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', natagare: [] };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behörighet att se nätägare', natagare: [] };
  }

  try {
    // Super Admin sees all natagare
    if (currentRole === ROLES.SUPER_ADMIN) {
      const natagare = await prisma.natagare.findMany({
        orderBy: { name: 'asc' },
      });
      return { natagare };
    }

    const orgId = session.user.orgId;
    if (!orgId) {
      return { error: 'Organisation krävs', natagare: [] };
    }

    // Other roles: global approved + org's pending/rejected
    const natagare = await prisma.natagare.findMany({
      where: {
        OR: [
          // Global approved natagare (visible to all)
          { globalScope: true, approvalStatus: ApprovalStatus.APPROVED },
          // Org's own pending/rejected requests
          { orgId: orgId },
        ],
      },
      orderBy: { name: 'asc' },
    });
    return { natagare };
  } catch (error) {
    console.error('Failed to get natagare:', error);
    return { error: 'Kunde inte hämta nätägare', natagare: [] };
  }
}

/**
 * Get a single natagare by ID.
 * Requires NATAGARE_VIEW permission.
 *
 * Phase 9: Can view global natagare or org's own pending/rejected requests.
 */
export async function getNatagareById(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behörighet att se nätägare' };
  }

  try {
    const natagare = await prisma.natagare.findUnique({
      where: { id },
    });

    if (!natagare) {
      return { error: 'Nätägare hittades inte' };
    }

    // Super Admin can see all
    if (currentRole === ROLES.SUPER_ADMIN) {
      return { natagare };
    }

    const orgId = session.user.orgId;

    // Global approved natagare are visible to all
    if (natagare.globalScope && natagare.approvalStatus === ApprovalStatus.APPROVED) {
      return { natagare };
    }

    // Org-specific natagare only visible to that org
    if (natagare.orgId === orgId) {
      return { natagare };
    }

    return { error: 'Du har inte behörighet att se denna nätägare' };
  } catch (error) {
    console.error('Failed to get natagare:', error);
    return { error: 'Kunde inte hämta nätägare' };
  }
}

/**
 * Seed default natagare for an organization.
 * Called during org creation or database seeding.
 * Uses global prisma client since this is an admin operation.
 *
 * NOTE: With Phase 9 global scope, this may be deprecated in favor of
 * global natagare that all orgs can see. Kept for backward compatibility.
 */
export async function seedDefaultNatagare(orgId: string) {
  const DEFAULT_NATAGARE = [
    {
      name: 'Ellevio',
      dayRateSekKw: 81.25,
      nightRateSekKw: 40.625, // Half of day rate
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Vattenfall Eldistribution (verifiera priser)',
      dayRateSekKw: 75.0,
      nightRateSekKw: 37.5,
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
    {
      name: 'E.ON Energidistribution (verifiera priser)',
      dayRateSekKw: 70.0,
      nightRateSekKw: 35.0,
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
  ];

  for (const natagare of DEFAULT_NATAGARE) {
    await prisma.natagare.upsert({
      where: { orgId_name: { orgId, name: natagare.name } },
      update: {},
      create: { ...natagare, orgId },
    });
  }
}

// =============================================================================
// GLOBAL NATAGARE QUERIES (Phase 9 - Centralized Management)
// =============================================================================

/**
 * Get all global approved natagare.
 * Available to all authenticated users (for dropdown selection).
 * No tenant scoping - uses global prisma client.
 */
export async function getGlobalNatagare() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', natagare: [] };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behörighet att se nätägare', natagare: [] };
  }

  try {
    const natagare = await prisma.natagare.findMany({
      where: {
        globalScope: true,
        approvalStatus: ApprovalStatus.APPROVED,
      },
      orderBy: { name: 'asc' },
    });
    return { natagare };
  } catch (error) {
    console.error('Failed to get global natagare:', error);
    return { error: 'Kunde inte hämta nätägare', natagare: [] };
  }
}

/**
 * Get org-specific natagare (pending/rejected requests).
 * For Org Admin to see their org's request status.
 */
export async function getOrgNatagare() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', natagare: [] };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behörighet att se nätägare', natagare: [] };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation krävs', natagare: [] };
  }

  try {
    const natagare = await prisma.natagare.findMany({
      where: {
        orgId: orgId,
        approvalStatus: {
          in: [ApprovalStatus.PENDING, ApprovalStatus.REJECTED],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { natagare };
  } catch (error) {
    console.error('Failed to get org natagare:', error);
    return { error: 'Kunde inte hämta organisationens nätägare', natagare: [] };
  }
}

/**
 * Get all pending natagare requiring approval.
 * Super Admin only - for approval dashboard widget.
 */
export async function getPendingNatagare() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', natagare: [] };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_APPROVE)) {
    return { error: 'Du har inte behörighet att godkänna nätägare', natagare: [] };
  }

  try {
    const natagare = await prisma.natagare.findMany({
      where: {
        approvalStatus: {
          in: [ApprovalStatus.PENDING, ApprovalStatus.DUPLICATE_REVIEW],
        },
      },
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { natagare };
  } catch (error) {
    console.error('Failed to get pending natagare:', error);
    return { error: 'Kunde inte hämta väntande nätägare', natagare: [] };
  }
}

// =============================================================================
// APPROVAL WORKFLOW ACTIONS (Phase 9)
// =============================================================================

/**
 * Approve a pending natagare request.
 * Super Admin only.
 * Sets approvalStatus=APPROVED, globalScope=true, orgId=null.
 */
export async function approveNatagare(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_APPROVE)) {
    return { error: 'Du har inte behörighet att godkänna nätägare' };
  }

  try {
    // Verify natagare exists and is pending
    const existing = await prisma.natagare.findUnique({
      where: { id },
    });
    if (!existing) {
      return { error: 'Nätägare hittades inte' };
    }
    if (existing.approvalStatus === ApprovalStatus.APPROVED && existing.globalScope) {
      return { error: 'Denna nätägare är redan godkänd' };
    }

    // Check for name collision with existing global natagare
    const existingGlobal = await prisma.natagare.findFirst({
      where: {
        name: existing.name,
        globalScope: true,
        id: { not: id },
      },
    });
    if (existingGlobal) {
      return {
        error: `En global nätägare med namnet "${existing.name}" finns redan. Vänligen avvisa eller byt namn.`,
      };
    }

    await prisma.natagare.update({
      where: { id },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
        globalScope: true,
        orgId: null, // Move to global scope
        approvedAt: new Date(),
        approvedByUserId: session.user.id,
      },
    });

    revalidatePath('/dashboard/natagare');
    revalidatePath('/dashboard/admin/natagare');
    return { success: true };
  } catch (error) {
    console.error('Failed to approve natagare:', error);
    return { error: 'Kunde inte godkänna nätägare' };
  }
}

/**
 * Reject a pending natagare request.
 * Super Admin only.
 * Sets approvalStatus=REJECTED, keeps orgId (remains org-specific).
 */
export async function rejectNatagare(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_APPROVE)) {
    return { error: 'Du har inte behörighet att avvisa nätägare' };
  }

  try {
    // Verify natagare exists
    const existing = await prisma.natagare.findUnique({
      where: { id },
    });
    if (!existing) {
      return { error: 'Nätägare hittades inte' };
    }
    if (existing.approvalStatus === ApprovalStatus.REJECTED) {
      return { error: 'Denna nätägare är redan avvisad' };
    }

    await prisma.natagare.update({
      where: { id },
      data: {
        approvalStatus: ApprovalStatus.REJECTED,
        // Keep orgId - remains org-specific, rejected
      },
    });

    revalidatePath('/dashboard/natagare');
    revalidatePath('/dashboard/admin/natagare');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject natagare:', error);
    return { error: 'Kunde inte avvisa nätägare' };
  }
}

// =============================================================================
// SUPER ADMIN CONFIGURATION (Phase 9)
// =============================================================================

const natagareConfigSchema = z.object({
  dayRateSekKw: z.number().min(0, 'Dagtariff får inte vara negativ').optional(),
  nightRateSekKw: z.number().min(0, 'Natttariff får inte vara negativ').optional(),
  dayStartHour: z.number().int().min(0).max(23, 'Ogiltig starttid').optional(),
  dayEndHour: z.number().int().min(0).max(23, 'Ogiltig sluttid').optional(),
  peakCalculationMethod: z.string().optional(),
  nightDiscountPercent: z.number().min(0).max(100).optional(),
  peakNightStartHour: z.number().int().min(0).max(23).optional(),
  peakNightEndHour: z.number().int().min(0).max(23).optional(),
});

/**
 * Update natagare configuration (rates, peak method, night discount).
 * Super Admin only - requires NATAGARE_CONFIG permission.
 */
export async function updateNatagareConfig(
  id: string,
  data: {
    dayRateSekKw?: number;
    nightRateSekKw?: number;
    dayStartHour?: number;
    dayEndHour?: number;
    peakCalculationMethod?: string;
    nightDiscountPercent?: number;
    peakNightStartHour?: number;
    peakNightEndHour?: number;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_CONFIG)) {
    return { error: 'Du har inte behörighet att konfigurera nätägare' };
  }

  // Validate input
  const parsed = natagareConfigSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Verify natagare exists
    const existing = await prisma.natagare.findUnique({
      where: { id },
    });
    if (!existing) {
      return { error: 'Nätägare hittades inte' };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.dayRateSekKw !== undefined) updateData.dayRateSekKw = data.dayRateSekKw;
    if (data.nightRateSekKw !== undefined) updateData.nightRateSekKw = data.nightRateSekKw;
    if (data.dayStartHour !== undefined) updateData.dayStartHour = data.dayStartHour;
    if (data.dayEndHour !== undefined) updateData.dayEndHour = data.dayEndHour;
    if (data.peakCalculationMethod !== undefined) {
      // Validate JSON format
      try {
        JSON.parse(data.peakCalculationMethod);
        updateData.peakCalculationMethod = data.peakCalculationMethod;
      } catch {
        return { error: 'Ogiltig effektberäkningsmetod format' };
      }
    }
    if (data.nightDiscountPercent !== undefined) {
      updateData.nightDiscountPercent = data.nightDiscountPercent;
    }
    if (data.peakNightStartHour !== undefined) {
      updateData.peakNightStartHour = data.peakNightStartHour;
    }
    if (data.peakNightEndHour !== undefined) {
      updateData.peakNightEndHour = data.peakNightEndHour;
    }

    await prisma.natagare.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard/natagare');
    revalidatePath('/dashboard/admin/natagare');
    return { success: true };
  } catch (error) {
    console.error('Failed to update natagare config:', error);
    return { error: 'Kunde inte uppdatera nätägare konfiguration' };
  }
}

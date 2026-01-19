'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createTenantClient } from '@/lib/db/tenant-client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

const natagareSchema = z.object({
  name: z.string().min(2, 'Namn maste vara minst 2 tecken').max(100),
  dayRateSekKw: z.number().min(0, 'Dagtariff far inte vara negativ'),
  nightRateSekKw: z.number().min(0, 'Natttariff far inte vara negativ'),
  dayStartHour: z.number().int().min(0).max(23, 'Ogiltig starttid'),
  dayEndHour: z.number().int().min(0).max(23, 'Ogiltig sluttid'),
});

export type NatagareFormData = z.infer<typeof natagareSchema>;

/**
 * Create a new natagare (grid operator) record.
 * Requires NATAGARE_CREATE permission.
 */
export async function createNatagare(data: NatagareFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_CREATE)) {
    return { error: 'Du har inte behorighet att skapa natagare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation kravs' };
  }

  const parsed = natagareSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tenantDb = createTenantClient(orgId);

    // Check if name already exists for this org
    const existing = await tenantDb.natagare.findFirst({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return { error: 'En natagare med detta namn finns redan' };
    }

    const natagare = await tenantDb.natagare.create({
      data: {
        name: parsed.data.name,
        dayRateSekKw: parsed.data.dayRateSekKw,
        nightRateSekKw: parsed.data.nightRateSekKw,
        dayStartHour: parsed.data.dayStartHour,
        dayEndHour: parsed.data.dayEndHour,
        isDefault: false,
        isActive: true,
      },
    });

    revalidatePath('/dashboard/natagare');
    return { success: true, natagareId: natagare.id };
  } catch (error) {
    console.error('Failed to create natagare:', error);
    return { error: 'Kunde inte skapa natagare' };
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
    return { error: 'Du har inte behorighet att redigera natagare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation kravs' };
  }

  try {
    const tenantDb = createTenantClient(orgId);

    // Verify natagare exists and belongs to org
    const existing = await tenantDb.natagare.findFirst({
      where: { id },
    });
    if (!existing) {
      return { error: 'Natagare hittades inte' };
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
        return { error: 'En natagare med detta namn finns redan' };
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
    return { error: 'Kunde inte uppdatera natagare' };
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
    return { error: 'Du har inte behorighet att ta bort natagare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation kravs' };
  }

  try {
    const tenantDb = createTenantClient(orgId);

    // Verify natagare exists and belongs to org
    const existing = await tenantDb.natagare.findFirst({
      where: { id },
    });
    if (!existing) {
      return { error: 'Natagare hittades inte' };
    }

    // Cannot delete default natagare
    if (existing.isDefault) {
      return { error: 'Forinstallda natagare kan inte tas bort. Du kan endast andra priserna.' };
    }

    await prisma.natagare.delete({
      where: { id },
    });

    revalidatePath('/dashboard/natagare');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete natagare:', error);
    return { error: 'Kunde inte ta bort natagare' };
  }
}

/**
 * Get all natagare for the current org.
 * Requires NATAGARE_VIEW permission.
 */
export async function getNatagare() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', natagare: [] };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behorighet att se natagare', natagare: [] };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation kravs', natagare: [] };
  }

  try {
    const tenantDb = createTenantClient(orgId);
    const natagare = await tenantDb.natagare.findMany({
      orderBy: { name: 'asc' },
    });
    return { natagare };
  } catch (error) {
    console.error('Failed to get natagare:', error);
    return { error: 'Kunde inte hamta natagare', natagare: [] };
  }
}

/**
 * Get a single natagare by ID.
 * Requires NATAGARE_VIEW permission.
 */
export async function getNatagareById(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.NATAGARE_VIEW)) {
    return { error: 'Du har inte behorighet att se natagare' };
  }

  const orgId = session.user.orgId;
  if (!orgId) {
    return { error: 'Organisation kravs' };
  }

  try {
    const tenantDb = createTenantClient(orgId);
    const natagare = await tenantDb.natagare.findFirst({
      where: { id },
    });

    if (!natagare) {
      return { error: 'Natagare hittades inte' };
    }

    return { natagare };
  } catch (error) {
    console.error('Failed to get natagare:', error);
    return { error: 'Kunde inte hamta natagare' };
  }
}

/**
 * Seed default natagare for an organization.
 * Called during org creation or database seeding.
 * Uses global prisma client since this is an admin operation.
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

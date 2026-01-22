'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createTenantClient } from '@/lib/db/tenant-client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const batteryBrandSchema = z.object({
  name: z.string().min(2, 'Varumärke måste vara minst 2 tecken').max(100),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

const batteryConfigSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken').max(100),
  brandId: z.string().cuid('Ogiltigt varumärke'),
  capacityKwh: z.number().positive('Kapacitet måste vara positiv'),
  maxDischargeKw: z.number().positive('Maxeffekt urladdning måste vara positiv'),
  maxChargeKw: z.number().positive('Maxeffekt laddning måste vara positiv'),
  chargeEfficiency: z.number().min(0).max(100, 'Effektivitet måste vara 0-100%'),
  dischargeEfficiency: z.number().min(0).max(100, 'Effektivitet måste vara 0-100%'),
  warrantyYears: z.number().int().positive('Garantitid måste vara minst 1 år'),
  guaranteedCycles: z.number().int().positive('Cykler måste vara minst 1'),
  degradationPerYear: z.number().min(0).max(100, 'Degradering måste vara 0-100%'),
  costPrice: z.number().min(0, 'Inköpspris får inte vara negativt'),
  isExtensionCabinet: z.boolean().default(false),
  isNewStack: z.boolean().default(true),
});

export type BatteryBrandFormData = z.infer<typeof batteryBrandSchema>;
export type BatteryConfigFormData = z.infer<typeof batteryConfigSchema>;

// =============================================================================
// BRAND ACTIONS
// =============================================================================

export async function createBatteryBrand(data: BatteryBrandFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_CREATE)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  const parsed = batteryBrandSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Explicitly include orgId for TypeScript - tenant client will override at runtime
    const brand = await tenantDb.batteryBrand.create({
      data: {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl || null,
        orgId: session.user.orgId,
      },
    });

    revalidatePath('/dashboard/batteries');
    return { success: true, brandId: brand.id };
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: 'Ett varumärke med detta namn finns redan' };
    }
    console.error('Failed to create battery brand:', error);
    return { error: 'Kunde inte skapa varumärket' };
  }
}

export async function updateBatteryBrand(
  brandId: string,
  data: Partial<BatteryBrandFormData>
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_EDIT)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Verify brand exists and belongs to org (tenant client handles scoping)
    const existingBrand = await tenantDb.batteryBrand.findFirst({
      where: { id: brandId },
    });

    if (!existingBrand) {
      return { error: 'Varumärket hittades inte' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;

    await tenantDb.batteryBrand.update({
      where: { id: brandId },
      data: updateData,
    });

    revalidatePath('/dashboard/batteries');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: 'Ett varumärke med detta namn finns redan' };
    }
    console.error('Failed to update battery brand:', error);
    return { error: 'Kunde inte uppdatera varumärket' };
  }
}

export async function deleteBatteryBrand(brandId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_DELETE)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Verify brand exists
    const existingBrand = await tenantDb.batteryBrand.findFirst({
      where: { id: brandId },
      include: { configs: { select: { id: true } } },
    });

    if (!existingBrand) {
      return { error: 'Varumärket hittades inte' };
    }

    // Check if brand has configs
    if (existingBrand.configs.length > 0) {
      return {
        error: `Varumärket har ${existingBrand.configs.length} konfiguration(er). Ta bort dessa först.`,
      };
    }

    await tenantDb.batteryBrand.delete({
      where: { id: brandId },
    });

    revalidatePath('/dashboard/batteries');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete battery brand:', error);
    return { error: 'Kunde inte ta bort varumärket' };
  }
}

export async function getBatteryBrands() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', brands: [] };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_VIEW)) {
    return { error: 'Du har inte behörighet', brands: [] };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas', brands: [] };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    const brands = await tenantDb.batteryBrand.findMany({
      orderBy: { name: 'asc' },
      include: {
        configs: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    // Convert Decimal fields to numbers for client consumption
    const serializedBrands = brands.map((brand) => ({
      ...brand,
      configs: brand.configs.map((config) => ({
        ...config,
        capacityKwh: Number(config.capacityKwh),
        maxDischargeKw: Number(config.maxDischargeKw),
        maxChargeKw: Number(config.maxChargeKw),
        chargeEfficiency: Number(config.chargeEfficiency),
        dischargeEfficiency: Number(config.dischargeEfficiency),
        degradationPerYear: Number(config.degradationPerYear),
        costPrice: Number(config.costPrice),
      })),
    }));

    return { brands: serializedBrands };
  } catch (error) {
    console.error('Failed to get battery brands:', error);
    return { error: 'Kunde inte hämta varumärken', brands: [] };
  }
}

// =============================================================================
// CONFIG ACTIONS
// =============================================================================

export async function createBatteryConfig(data: BatteryConfigFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_CREATE)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  const parsed = batteryConfigSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Verify brand exists and belongs to same org
    const brand = await tenantDb.batteryBrand.findFirst({
      where: { id: parsed.data.brandId },
    });

    if (!brand) {
      return { error: 'Varumärket hittades inte' };
    }

    // Explicitly include orgId for TypeScript - tenant client will override at runtime
    const config = await tenantDb.batteryConfig.create({
      data: {
        name: parsed.data.name,
        brandId: parsed.data.brandId,
        orgId: session.user.orgId,
        capacityKwh: parsed.data.capacityKwh,
        maxDischargeKw: parsed.data.maxDischargeKw,
        maxChargeKw: parsed.data.maxChargeKw,
        chargeEfficiency: parsed.data.chargeEfficiency,
        dischargeEfficiency: parsed.data.dischargeEfficiency,
        warrantyYears: parsed.data.warrantyYears,
        guaranteedCycles: parsed.data.guaranteedCycles,
        degradationPerYear: parsed.data.degradationPerYear,
        costPrice: parsed.data.costPrice,
        isExtensionCabinet: parsed.data.isExtensionCabinet,
        isNewStack: parsed.data.isNewStack,
      },
    });

    revalidatePath('/dashboard/batteries');
    return { success: true, configId: config.id };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: 'En konfiguration med detta namn finns redan för detta varumärke' };
    }
    console.error('Failed to create battery config:', error);
    return { error: 'Kunde inte skapa konfigurationen' };
  }
}

export async function updateBatteryConfig(
  configId: string,
  data: Partial<BatteryConfigFormData>
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_EDIT)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Verify config exists
    const existingConfig = await tenantDb.batteryConfig.findFirst({
      where: { id: configId },
    });

    if (!existingConfig) {
      return { error: 'Konfigurationen hittades inte' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacityKwh !== undefined) updateData.capacityKwh = data.capacityKwh;
    if (data.maxDischargeKw !== undefined) updateData.maxDischargeKw = data.maxDischargeKw;
    if (data.maxChargeKw !== undefined) updateData.maxChargeKw = data.maxChargeKw;
    if (data.chargeEfficiency !== undefined) updateData.chargeEfficiency = data.chargeEfficiency;
    if (data.dischargeEfficiency !== undefined) updateData.dischargeEfficiency = data.dischargeEfficiency;
    if (data.warrantyYears !== undefined) updateData.warrantyYears = data.warrantyYears;
    if (data.guaranteedCycles !== undefined) updateData.guaranteedCycles = data.guaranteedCycles;
    if (data.degradationPerYear !== undefined) updateData.degradationPerYear = data.degradationPerYear;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.isExtensionCabinet !== undefined) updateData.isExtensionCabinet = data.isExtensionCabinet;
    if (data.isNewStack !== undefined) updateData.isNewStack = data.isNewStack;

    await tenantDb.batteryConfig.update({
      where: { id: configId },
      data: updateData,
    });

    revalidatePath('/dashboard/batteries');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { error: 'En konfiguration med detta namn finns redan för detta varumärke' };
    }
    console.error('Failed to update battery config:', error);
    return { error: 'Kunde inte uppdatera konfigurationen' };
  }
}

export async function deleteBatteryConfig(configId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_DELETE)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    // Verify config exists
    const existingConfig = await tenantDb.batteryConfig.findFirst({
      where: { id: configId },
    });

    if (!existingConfig) {
      return { error: 'Konfigurationen hittades inte' };
    }

    await tenantDb.batteryConfig.delete({
      where: { id: configId },
    });

    revalidatePath('/dashboard/batteries');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete battery config:', error);
    return { error: 'Kunde inte ta bort konfigurationen' };
  }
}

export async function getBatteryConfigs(brandId?: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', configs: [] };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_VIEW)) {
    return { error: 'Du har inte behörighet', configs: [] };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas', configs: [] };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    const whereClause: Record<string, unknown> = { isActive: true };
    if (brandId) {
      whereClause.brandId = brandId;
    }

    const configs = await tenantDb.batteryConfig.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        brand: {
          select: { id: true, name: true },
        },
      },
    });

    // Convert Decimal fields to numbers for client consumption
    const serializedConfigs = configs.map((config) => ({
      ...config,
      capacityKwh: Number(config.capacityKwh),
      maxDischargeKw: Number(config.maxDischargeKw),
      maxChargeKw: Number(config.maxChargeKw),
      chargeEfficiency: Number(config.chargeEfficiency),
      dischargeEfficiency: Number(config.dischargeEfficiency),
      degradationPerYear: Number(config.degradationPerYear),
      costPrice: Number(config.costPrice),
    }));

    return { configs: serializedConfigs };
  } catch (error) {
    console.error('Failed to get battery configs:', error);
    return { error: 'Kunde inte hämta konfigurationer', configs: [] };
  }
}

export async function getBatteryConfig(configId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_VIEW)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    const config = await tenantDb.batteryConfig.findFirst({
      where: { id: configId },
      include: {
        brand: {
          select: { id: true, name: true },
        },
      },
    });

    if (!config) {
      return { error: 'Konfigurationen hittades inte' };
    }

    // Convert Decimal fields to numbers for client consumption
    const serializedConfig = {
      ...config,
      capacityKwh: Number(config.capacityKwh),
      maxDischargeKw: Number(config.maxDischargeKw),
      maxChargeKw: Number(config.maxChargeKw),
      chargeEfficiency: Number(config.chargeEfficiency),
      dischargeEfficiency: Number(config.dischargeEfficiency),
      degradationPerYear: Number(config.degradationPerYear),
      costPrice: Number(config.costPrice),
    };

    return { config: serializedConfig };
  } catch (error) {
    console.error('Failed to get battery config:', error);
    return { error: 'Kunde inte hämta konfigurationen' };
  }
}

export async function getBatteryBrand(brandId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.BATTERY_VIEW)) {
    return { error: 'Du har inte behörighet' };
  }

  if (!session.user.orgId) {
    return { error: 'Organisation saknas' };
  }

  try {
    const tenantDb = createTenantClient(session.user.orgId);

    const brand = await tenantDb.batteryBrand.findFirst({
      where: { id: brandId },
    });

    if (!brand) {
      return { error: 'Varumärket hittades inte' };
    }

    return { brand };
  } catch (error) {
    console.error('Failed to get battery brand:', error);
    return { error: 'Kunde inte hämta varumärket' };
  }
}

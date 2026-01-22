'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

const organizationSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken').max(100),
  slug: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug kan bara innehålla småbokstäver, siffror och bindestreck'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig färgkod').default('#3B82F6'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig färgkod').default('#1E40AF'),
  isProffsKontaktAffiliated: z.boolean().default(false),
  installerFixedCut: z.number().min(0).optional(), // Fixed SEK amount to installer
  marginAlertThreshold: z.number().min(0).optional(), // Min margin in SEK before alert
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export async function createOrganization(data: OrganizationFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  if (!hasPermission(session.user.role as Role, PERMISSIONS.ORG_CREATE)) {
    return { error: 'Du har inte behörighet att skapa organisationer' };
  }

  const parsed = organizationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check slug uniqueness
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existingOrg) {
    return { error: 'En organisation med denna slug finns redan' };
  }

  try {
    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        logoUrl: parsed.data.logoUrl || null,
        primaryColor: parsed.data.primaryColor,
        secondaryColor: parsed.data.secondaryColor,
        isProffsKontaktAffiliated: parsed.data.isProffsKontaktAffiliated,
        installerFixedCut: parsed.data.isProffsKontaktAffiliated
          ? parsed.data.installerFixedCut
          : null,
        marginAlertThreshold: parsed.data.isProffsKontaktAffiliated
          ? parsed.data.marginAlertThreshold
          : null,
      },
    });

    revalidatePath('/admin/organizations');
    return { success: true, organizationId: org.id };
  } catch (error) {
    console.error('Failed to create organization:', error);
    return { error: 'Kunde inte skapa organisationen' };
  }
}

export async function updateOrganization(id: string, data: Partial<OrganizationFormData>) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  const isSuperAdmin = hasPermission(role, PERMISSIONS.ORG_EDIT_ANY);
  const isOrgAdmin = hasPermission(role, PERMISSIONS.ORG_EDIT_OWN);

  // Org Admin can only edit their own org
  if (!isSuperAdmin && isOrgAdmin && session.user.orgId !== id) {
    return { error: 'Du kan bara redigera din egen organisation' };
  }

  if (!isSuperAdmin && !isOrgAdmin) {
    return { error: 'Du har inte behörighet att redigera organisationer' };
  }

  // Org Admin cannot change affiliation status or installer cut
  if (!isSuperAdmin && (data.isProffsKontaktAffiliated !== undefined || data.installerFixedCut !== undefined)) {
    return { error: 'Endast Super Admin kan ändra affiliatingstatus' };
  }

  try {
    await prisma.organization.update({
      where: { id },
      data: {
        ...data,
        logoUrl: data.logoUrl || null,
      },
    });

    revalidatePath('/admin/organizations');
    revalidatePath(`/admin/organizations/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update organization:', error);
    return { error: 'Kunde inte uppdatera organisationen' };
  }
}

export async function getOrganizations() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', organizations: [] };
  }

  if (!hasPermission(session.user.role as Role, PERMISSIONS.ORG_VIEW_ALL)) {
    return { error: 'Du har inte behörighet att se alla organisationer', organizations: [] };
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  // Convert Decimal to number for client components
  const serializedOrgs = organizations.map(org => ({
    ...org,
    installerFixedCut: org.installerFixedCut ? Number(org.installerFixedCut) : null,
    marginAlertThreshold: org.marginAlertThreshold ? Number(org.marginAlertThreshold) : null,
  }));

  return { organizations: serializedOrgs };
}

export async function getOrganization(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  const canViewAll = hasPermission(role, PERMISSIONS.ORG_VIEW_ALL);
  const canViewOwn = session.user.orgId === id;

  if (!canViewAll && !canViewOwn) {
    return { error: 'Du har inte behörighet att se denna organisation' };
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!organization) {
    return { error: 'Organisationen hittades inte' };
  }

  // Convert Decimal to number for client components
  const serializedOrg = {
    ...organization,
    installerFixedCut: organization.installerFixedCut ? Number(organization.installerFixedCut) : null,
    marginAlertThreshold: organization.marginAlertThreshold ? Number(organization.marginAlertThreshold) : null,
  };

  return { organization: serializedOrg };
}

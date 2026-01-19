'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createTenantClient } from '@/lib/db/tenant-client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, ROLES, Role } from '@/lib/auth/permissions';

const userSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  name: z.string().min(2, 'Namn maste vara minst 2 tecken'),
  password: z.string().min(8, 'Losenordet maste vara minst 8 tecken').optional(),
  role: z.enum(['ORG_ADMIN', 'CLOSER']),
  orgId: z.string().cuid(),
});

export type UserFormData = z.infer<typeof userSchema>;

export async function createUser(data: UserFormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;
  const targetRole = data.role as Role;

  // Permission checks based on role hierarchy
  if (targetRole === ROLES.ORG_ADMIN) {
    // Only Super Admin can create Org Admins
    if (!hasPermission(currentRole, PERMISSIONS.USER_CREATE_ORG_ADMIN)) {
      return { error: 'Du har inte behorighet att skapa Org Admin-anvandare' };
    }
  } else if (targetRole === ROLES.CLOSER) {
    // Super Admin or Org Admin can create Closers
    if (!hasPermission(currentRole, PERMISSIONS.USER_CREATE_CLOSER)) {
      return { error: 'Du har inte behorighet att skapa Closer-anvandare' };
    }
    // Org Admin can only create in their own org
    if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== data.orgId) {
      return { error: 'Du kan bara skapa anvandare i din egen organisation' };
    }
  }

  // Verify org exists
  const org = await prisma.organization.findUnique({ where: { id: data.orgId } });
  if (!org) {
    return { error: 'Organisationen hittades inte' };
  }

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: 'En anvandare med denna e-postadress finns redan' };
  }

  const parsed = userSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Require password for new users
  if (!parsed.data.password) {
    return { error: 'Losenord kravs for nya anvandare' };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
        orgId: parsed.data.orgId,
        isActive: true,
      },
    });

    revalidatePath('/dashboard/users');
    revalidatePath('/admin/organizations');
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Failed to create user:', error);
    return { error: 'Kunde inte skapa anvandaren' };
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Omit<UserFormData, 'password'> & { password?: string }>
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  // Get target user
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: 'Anvandaren hittades inte' };
  }

  // Check permission to edit
  if (!hasPermission(currentRole, PERMISSIONS.USER_EDIT)) {
    return { error: 'Du har inte behorighet att redigera anvandare' };
  }

  // Org Admin can only edit users in their own org
  if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== targetUser.orgId) {
    return { error: 'Du kan bara redigera anvandare i din egen organisation' };
  }

  // Cannot change Super Admin users (or become Super Admin)
  if (targetUser.role === ROLES.SUPER_ADMIN || data.role === 'SUPER_ADMIN') {
    return { error: 'Super Admin-anvandare kan inte redigeras' };
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    // Password update - only if provided (AUTH-04: admin password reset)
    if (data.password && data.password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { error: 'Kunde inte uppdatera anvandaren' };
  }
}

export async function deactivateUser(userId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.USER_DEACTIVATE)) {
    return { error: 'Du har inte behorighet att inaktivera anvandare' };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: 'Anvandaren hittades inte' };
  }

  // Org Admin can only deactivate users in their own org
  if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== targetUser.orgId) {
    return { error: 'Du kan bara inaktivera anvandare i din egen organisation' };
  }

  // Cannot deactivate Super Admin
  if (targetUser.role === ROLES.SUPER_ADMIN) {
    return { error: 'Super Admin-anvandare kan inte inaktiveras' };
  }

  // Cannot deactivate yourself
  if (targetUser.id === session.user.id) {
    return { error: 'Du kan inte inaktivera dig sjalv' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return { error: 'Kunde inte inaktivera anvandaren' };
  }
}

export async function getUsers() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad', users: [] };
  }

  const currentRole = session.user.role as Role;

  // Super Admin sees all users
  if (hasPermission(currentRole, PERMISSIONS.USER_VIEW_ALL)) {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
    });
    return { users };
  }

  // Org Admin sees users in their org
  if (hasPermission(currentRole, PERMISSIONS.USER_VIEW_ORG) && session.user.orgId) {
    const tenantClient = createTenantClient(session.user.orgId);
    const users = await tenantClient.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
    });
    return { users };
  }

  return { error: 'Du har inte behorighet att se anvandare', users: [] };
}

export async function getUser(userId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!user) {
    return { error: 'Anvandaren hittades inte' };
  }

  // Check access
  const currentRole = session.user.role as Role;
  if (!hasPermission(currentRole, PERMISSIONS.USER_VIEW_ALL)) {
    if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== user.orgId) {
      return { error: 'Du har inte behorighet att se denna anvandare' };
    }
    if (currentRole === ROLES.CLOSER && session.user.id !== user.id) {
      return { error: 'Du har inte behorighet att se denna anvandare' };
    }
  }

  return { user };
}

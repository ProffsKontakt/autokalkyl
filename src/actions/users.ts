'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createTenantClient } from '@/lib/db/tenant-client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, ROLES, Role } from '@/lib/auth/permissions';
import { strongPasswordSchema, optionalStrongPasswordSchema } from '@/lib/validation/password';
import { logSecurityEvent, SecurityEventType } from '@/lib/audit/logger';

const userSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
  password: strongPasswordSchema.optional(),
  role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'CLOSER']),
  orgId: z.string().cuid().optional(), // Optional for SUPER_ADMIN
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
  if (targetRole === ROLES.SUPER_ADMIN) {
    // Only Super Admin can create Super Admins
    if (currentRole !== ROLES.SUPER_ADMIN) {
      return { error: 'Endast Super Admin kan skapa Super Admin-användare' };
    }
  } else if (targetRole === ROLES.ORG_ADMIN) {
    // Only Super Admin can create Org Admins
    if (!hasPermission(currentRole, PERMISSIONS.USER_CREATE_ORG_ADMIN)) {
      return { error: 'Du har inte behörighet att skapa Org Admin-användare' };
    }
  } else if (targetRole === ROLES.CLOSER) {
    // Super Admin or Org Admin can create Closers
    if (!hasPermission(currentRole, PERMISSIONS.USER_CREATE_CLOSER)) {
      return { error: 'Du har inte behörighet att skapa Closer-användare' };
    }
    // Org Admin can only create in their own org
    if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== data.orgId) {
      return { error: 'Du kan bara skapa användare i din egen organisation' };
    }
  }

  // Super Admin doesn't need an org, others do
  if (targetRole !== ROLES.SUPER_ADMIN) {
    if (!data.orgId) {
      return { error: 'Organisation krävs' };
    }
    const org = await prisma.organization.findUnique({ where: { id: data.orgId } });
    if (!org) {
      return { error: 'Organisationen hittades inte' };
    }
  }

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: 'En användare med denna e-postadress finns redan' };
  }

  const parsed = userSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Require password for new users
  if (!parsed.data.password) {
    return { error: 'Lösenord krävs för nya användare' };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
        orgId: parsed.data.role === 'SUPER_ADMIN' ? null : parsed.data.orgId,
        isActive: true,
      },
    });

    await logSecurityEvent({
      type: SecurityEventType.USER_CREATED,
      userId: session.user.id,
      targetUserId: user.id,
      orgId: session.user.orgId ?? undefined,
      metadata: {
        targetEmail: user.email,
        targetRole: user.role,
        targetOrgId: user.orgId,
      },
    });

    revalidatePath('/dashboard/users');
    revalidatePath('/admin/organizations');
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Failed to create user:', error);
    return { error: 'Kunde inte skapa användaren' };
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
    return { error: 'Användaren hittades inte' };
  }

  // Check permission to edit
  if (!hasPermission(currentRole, PERMISSIONS.USER_EDIT)) {
    return { error: 'Du har inte behörighet att redigera användare' };
  }

  // Org Admin can only edit users in their own org
  if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== targetUser.orgId) {
    return { error: 'Du kan bara redigera användare i din egen organisation' };
  }

  // Super Admin editing rules
  if (targetUser.role === ROLES.SUPER_ADMIN) {
    // Only Super Admin can edit Super Admin
    if (currentRole !== ROLES.SUPER_ADMIN) {
      return { error: 'Endast Super Admin kan redigera Super Admin-användare' };
    }
    // Cannot change Super Admin's role
    if (data.role && data.role !== 'SUPER_ADMIN') {
      return { error: 'Super Admin-rollen kan inte ändras' };
    }
  }

  // Non-Super Admin cannot become Super Admin
  if (targetUser.role !== ROLES.SUPER_ADMIN && data.role === 'SUPER_ADMIN') {
    return { error: 'Användare kan inte uppgraderas till Super Admin' };
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;

    // Track role changes for audit
    const roleChanged = data.role && data.role !== targetUser.role;
    if (data.role) updateData.role = data.role;

    // Password update - validate with strong password requirements
    if (data.password) {
      const passwordValidation = strongPasswordSchema.safeParse(data.password);
      if (!passwordValidation.success) {
        return { error: passwordValidation.error.issues[0].message };
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log security events
    await logSecurityEvent({
      type: SecurityEventType.USER_UPDATED,
      userId: session.user.id,
      targetUserId: userId,
      metadata: {
        fieldsUpdated: Object.keys(updateData),
        passwordChanged: !!data.password,
      },
    });

    if (roleChanged) {
      await logSecurityEvent({
        type: SecurityEventType.USER_ROLE_CHANGED,
        userId: session.user.id,
        targetUserId: userId,
        metadata: {
          previousRole: targetUser.role,
          newRole: data.role,
        },
      });
    }

    if (data.password) {
      await logSecurityEvent({
        type: SecurityEventType.PASSWORD_CHANGED,
        userId: session.user.id,
        targetUserId: userId,
        metadata: { adminReset: true },
      });
    }

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { error: 'Kunde inte uppdatera användaren' };
  }
}

export async function deactivateUser(userId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const currentRole = session.user.role as Role;

  if (!hasPermission(currentRole, PERMISSIONS.USER_DEACTIVATE)) {
    return { error: 'Du har inte behörighet att inaktivera användare' };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: 'Användaren hittades inte' };
  }

  // Org Admin can only deactivate users in their own org
  if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== targetUser.orgId) {
    return { error: 'Du kan bara inaktivera användare i din egen organisation' };
  }

  // Cannot deactivate Super Admin
  if (targetUser.role === ROLES.SUPER_ADMIN) {
    return { error: 'Super Admin-användare kan inte inaktiveras' };
  }

  // Cannot deactivate yourself
  if (targetUser.id === session.user.id) {
    return { error: 'Du kan inte inaktivera dig själv' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await logSecurityEvent({
      type: SecurityEventType.USER_DEACTIVATED,
      userId: session.user.id,
      targetUserId: userId,
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return { error: 'Kunde inte inaktivera användaren' };
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

  return { error: 'Du har inte behörighet att se användare', users: [] };
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
    return { error: 'Användaren hittades inte' };
  }

  // Check access
  const currentRole = session.user.role as Role;
  if (!hasPermission(currentRole, PERMISSIONS.USER_VIEW_ALL)) {
    if (currentRole === ROLES.ORG_ADMIN && session.user.orgId !== user.orgId) {
      return { error: 'Du har inte behörighet att se denna användare' };
    }
    if (currentRole === ROLES.CLOSER && session.user.id !== user.id) {
      return { error: 'Du har inte behörighet att se denna användare' };
    }
  }

  return { user };
}

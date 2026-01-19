'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUser, updateUser, UserFormData } from '@/actions/users';
import { getOrganizations } from '@/actions/organizations';
import { ROLES, hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

const userSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  name: z.string().min(2, 'Namn maste vara minst 2 tecken'),
  password: z.string().min(8, 'Losenordet maste vara minst 8 tecken').optional().or(z.literal('')),
  role: z.enum(['ORG_ADMIN', 'CLOSER']),
  orgId: z.string().min(1, 'Valj en organisation'),
});

type FormData = z.infer<typeof userSchema>;

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    orgId: string | null;
    organization?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  currentUserRole: Role;
  currentUserOrgId: string | null;
}

export function UserForm({ user, currentUserRole, currentUserOrgId }: UserFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(() => currentUserRole === ROLES.SUPER_ADMIN);
  const router = useRouter();
  const isEditing = !!user;
  const isSuperAdmin = currentUserRole === ROLES.SUPER_ADMIN;
  const canCreateOrgAdmin = hasPermission(currentUserRole, PERMISSIONS.USER_CREATE_ORG_ADMIN);

  // Load organizations for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      let cancelled = false;
      getOrganizations().then(({ organizations: orgs }) => {
        if (!cancelled) {
          setOrganizations(orgs || []);
          setLoadingOrgs(false);
        }
      });
      return () => { cancelled = true; };
    }
  }, [isSuperAdmin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      email: user.email,
      name: user.name,
      password: '',
      role: user.role as 'ORG_ADMIN' | 'CLOSER',
      orgId: user.orgId || '',
    } : {
      role: 'CLOSER',
      orgId: currentUserOrgId || '',
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      // For editing, only include password if provided
      const submitData = isEditing
        ? {
            email: data.email,
            name: data.name,
            role: data.role,
            ...(data.password && data.password.length >= 8 ? { password: data.password } : {}),
          }
        : data;

      const result = isEditing
        ? await updateUser(user.id, submitData)
        : await createUser(data as UserFormData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/users');
        router.refresh();
      }
    });
  };

  // Determine available roles based on current user
  const availableRoles = canCreateOrgAdmin
    ? [{ value: 'ORG_ADMIN', label: 'Org Admin' }, { value: 'CLOSER', label: 'Closer' }]
    : [{ value: 'CLOSER', label: 'Closer' }];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Namn *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-postadress *</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {isEditing ? 'Nytt losenord (valfritt)' : 'Losenord *'}
        </Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder={isEditing ? 'Lamna tomt for att behalla nuvarande losenord' : ''}
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        {isEditing && (
          <p className="text-xs text-gray-500">
            Lamna tomt for att behalla nuvarande losenord. Minst 8 tecken for nytt losenord.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Roll *</Label>
        <select
          id="role"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          {...register('role')}
        >
          {availableRoles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
      </div>

      {/* Organization dropdown - only for Super Admin */}
      {isSuperAdmin ? (
        <div className="space-y-2">
          <Label htmlFor="orgId">Organisation *</Label>
          {loadingOrgs ? (
            <p className="text-sm text-gray-500">Laddar organisationer...</p>
          ) : (
            <select
              id="orgId"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              {...register('orgId')}
              disabled={isEditing}
            >
              <option value="">Valj organisation</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          )}
          {errors.orgId && <p className="text-sm text-red-600">{errors.orgId.message}</p>}
          {isEditing && (
            <p className="text-xs text-gray-500">
              Organisation kan inte andras efter att anvandaren skapats.
            </p>
          )}
        </div>
      ) : (
        /* Org Admin - hidden field with their org */
        <input type="hidden" {...register('orgId')} value={currentUserOrgId || ''} />
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sparar...' : isEditing ? 'Spara andringar' : 'Skapa anvandare'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

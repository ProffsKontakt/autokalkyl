'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganization, updateOrganization } from '@/actions/organizations';

const orgSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Endast småbokstäver, siffror och bindestreck'),
  logoUrl: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isProffsKontaktAffiliated: z.boolean(),
  installerFixedCut: z.number().min(0).optional(),
  marginAlertThreshold: z.number().min(0).optional(),
});

type OrgFormData = z.infer<typeof orgSchema>;

interface OrgFormProps {
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    isProffsKontaktAffiliated: boolean;
    installerFixedCut: number | null;
    marginAlertThreshold: number | null;
  };
}

export function OrgForm({ organization }: OrgFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!organization;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: organization ? {
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl || '',
      primaryColor: organization.primaryColor,
      secondaryColor: organization.secondaryColor,
      isProffsKontaktAffiliated: organization.isProffsKontaktAffiliated,
      installerFixedCut: organization.installerFixedCut ?? undefined,
      marginAlertThreshold: organization.marginAlertThreshold ?? undefined,
    } : {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      isProffsKontaktAffiliated: false,
    },
  });

  const isProffsKontakt = watch('isProffsKontaktAffiliated');

  const onSubmit = (data: OrgFormData) => {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateOrganization(organization.id, data)
        : await createOrganization(data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/admin/organizations');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Organisationsnamn *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (för URL) *</Label>
        <Input id="slug" {...register('slug')} placeholder="acme-solar" disabled={isEditing} />
        {errors.slug && <p className="text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>}
        <p className="text-xs text-slate-500 dark:text-slate-400">Används i URL:er, t.ex. kalkyla.se/acme-solar/...</p>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Varumärke</h3>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logotyp URL</Label>
          <Input id="logoUrl" type="url" {...register('logoUrl')} placeholder="https://..." />
          {errors.logoUrl && <p className="text-sm text-red-600 dark:text-red-400">{errors.logoUrl.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primärfärg</Label>
            <div className="flex gap-2">
              <Input type="color" className="w-12 h-10 p-1" {...register('primaryColor')} />
              <Input {...register('primaryColor')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Sekundärfärg</Label>
            <div className="flex gap-2">
              <Input type="color" className="w-12 h-10 p-1" {...register('secondaryColor')} />
              <Input {...register('secondaryColor')} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">ProffsKontakt-affiliation</h3>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isProffsKontaktAffiliated"
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-offset-slate-800"
            {...register('isProffsKontaktAffiliated')}
          />
          <Label htmlFor="isProffsKontaktAffiliated">Affilierad med ProffsKontakt</Label>
        </div>

        {isProffsKontakt && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <Label htmlFor="installerFixedCut">Installatorns fasta arvode (SEK)</Label>
              <Input
                id="installerFixedCut"
                type="number"
                min="0"
                step="100"
                {...register('installerFixedCut', { valueAsNumber: true })}
                placeholder="t.ex. 23000"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fast belopp i SEK som går till installationspartner per installation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginAlertThreshold">Marginal-varningsgräns (SEK)</Label>
              <Input
                id="marginAlertThreshold"
                type="number"
                min="0"
                step="100"
                {...register('marginAlertThreshold', { valueAsNumber: true })}
                placeholder="t.ex. 24000"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skickar varning om ProffsKontakts marginal understiger detta belopp
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending} variant="gradient">
          {isPending ? 'Sparar...' : isEditing ? 'Spara ändringar' : 'Skapa organisation'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

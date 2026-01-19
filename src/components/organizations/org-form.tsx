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
  name: z.string().min(2, 'Namn maste vara minst 2 tecken'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Endast smabokstaver, siffror och bindestreck'),
  logoUrl: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isProffsKontaktAffiliated: z.boolean(),
  partnerCutPercent: z.number().min(0).max(100).optional(),
  marginAlertThreshold: z.number().min(0).max(100).optional(),
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
    partnerCutPercent: number | null;
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
      partnerCutPercent: organization.partnerCutPercent || undefined,
      marginAlertThreshold: organization.marginAlertThreshold || undefined,
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Organisationsnamn *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (for URL) *</Label>
        <Input id="slug" {...register('slug')} placeholder="acme-solar" disabled={isEditing} />
        {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
        <p className="text-xs text-gray-500">Anvands i URL:er, t.ex. kalkyla.se/acme-solar/...</p>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Varumarke</h3>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logotyp URL</Label>
          <Input id="logoUrl" type="url" {...register('logoUrl')} placeholder="https://..." />
          {errors.logoUrl && <p className="text-sm text-red-600">{errors.logoUrl.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primarfarg</Label>
            <div className="flex gap-2">
              <Input type="color" className="w-12 h-10 p-1" {...register('primaryColor')} />
              <Input {...register('primaryColor')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Sekundarfarg</Label>
            <div className="flex gap-2">
              <Input type="color" className="w-12 h-10 p-1" {...register('secondaryColor')} />
              <Input {...register('secondaryColor')} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">ProffsKontakt-affiliation</h3>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isProffsKontaktAffiliated"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...register('isProffsKontaktAffiliated')}
          />
          <Label htmlFor="isProffsKontaktAffiliated">Affilierad med ProffsKontakt</Label>
        </div>

        {isProffsKontakt && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="partnerCutPercent">Partner-provision (%)</Label>
              <Input
                id="partnerCutPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...register('partnerCutPercent')}
              />
              <p className="text-xs text-gray-500">
                Andel som gar till installationspartner
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginAlertThreshold">Marginal-varningsgrans (%)</Label>
              <Input
                id="marginAlertThreshold"
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...register('marginAlertThreshold')}
              />
              <p className="text-xs text-gray-500">
                Skickar varning om marginalen understiger denna niva
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sparar...' : isEditing ? 'Spara andringar' : 'Skapa organisation'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

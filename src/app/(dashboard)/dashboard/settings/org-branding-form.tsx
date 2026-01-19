'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateOrganization } from '@/actions/organizations';

const brandingSchema = z.object({
  logoUrl: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig fargkod'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig fargkod'),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

interface OrgBrandingFormProps {
  organizationId: string;
  defaultValues: BrandingFormData;
}

export function OrgBrandingForm({ organizationId, defaultValues }: OrgBrandingFormProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues,
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  const onSubmit = (data: BrandingFormData) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateOrganization(organizationId, data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        // Clear success after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Andringarna har sparats!
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logotyp URL</Label>
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://example.com/logo.png"
          {...register('logoUrl')}
        />
        {errors.logoUrl && (
          <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Lankning till er logotyp. Rekommenderad storlek: 200x50 px (PNG eller SVG)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primarfarg</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-12 h-10 p-1 cursor-pointer"
              {...register('primaryColor')}
            />
            <Input {...register('primaryColor')} />
          </div>
          {errors.primaryColor && (
            <p className="text-sm text-red-600">{errors.primaryColor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Sekundarfarg</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-12 h-10 p-1 cursor-pointer"
              {...register('secondaryColor')}
            />
            <Input {...register('secondaryColor')} />
          </div>
          {errors.secondaryColor && (
            <p className="text-sm text-red-600">{errors.secondaryColor.message}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-sm text-gray-500 mb-3">Forhandsgranskning:</p>
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Knapp
          </div>
          <div
            className="w-24 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: secondaryColor }}
          >
            Sekundar
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sparar...' : 'Spara andringar'}
      </Button>
    </form>
  );
}

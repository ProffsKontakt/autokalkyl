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
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig färgkod'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig färgkod'),
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
    setValue,
    formState: { errors },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues,
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    setValue(field, value, { shouldValidate: true });
  };

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
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          Ändringarna har sparats!
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
          <p className="text-sm text-red-600 dark:text-red-400">{errors.logoUrl.message}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Länkning till er logotyp. Rekommenderad storlek: 200x50 px (PNG eller SVG)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primärfärg</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
            />
            <Input
              value={primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              placeholder="#3B82F6"
            />
          </div>
          {errors.primaryColor && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.primaryColor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Sekundärfärg</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              placeholder="#1E40AF"
            />
          </div>
          {errors.secondaryColor && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.secondaryColor.message}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Förhandsgranskning:</p>
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
            Sekundär
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sparar...' : 'Spara ändringar'}
      </Button>
    </form>
  );
}

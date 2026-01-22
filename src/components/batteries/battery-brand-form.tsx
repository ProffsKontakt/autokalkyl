'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBatteryBrand, updateBatteryBrand } from '@/actions/batteries';

const batteryBrandSchema = z.object({
  name: z.string().min(2, 'Varumärke måste vara minst 2 tecken').max(100),
  logoUrl: z.string().url('Ogiltig URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof batteryBrandSchema>;

interface BatteryBrandFormProps {
  brand?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export function BatteryBrandForm({ brand }: BatteryBrandFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!brand;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(batteryBrandSchema),
    defaultValues: brand
      ? {
          name: brand.name,
          logoUrl: brand.logoUrl || '',
        }
      : {
          name: '',
          logoUrl: '',
        },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateBatteryBrand(brand.id, data)
        : await createBatteryBrand(data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/batteries');
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
        <Label htmlFor="name">Varumärke *</Label>
        <Input id="name" {...register('name')} placeholder="t.ex. Emaldo" />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logotyp URL (valfritt)</Label>
        <Input
          id="logoUrl"
          type="url"
          {...register('logoUrl')}
          placeholder="https://example.com/logo.png"
        />
        {errors.logoUrl && (
          <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Ange URL till varumärkets logotyp för att visa den i listan.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Sparar...'
            : isEditing
              ? 'Spara ändringar'
              : 'Skapa varumärke'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

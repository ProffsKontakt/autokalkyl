'use client';

/**
 * Simplified form for Org Admin to request new natagare.
 * Creates a pending natagare visible only to their organization
 * until Super Admin approves it for global access.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createNatagare } from '@/actions/natagare';

const requestSchema = z.object({
  name: z.string().min(2, 'Namn maaste vara minst 2 tecken').max(100),
  dayRateSekKw: z.number().min(0, 'Dagtariff faar inte vara negativ'),
  nightRateSekKw: z.number().min(0, 'Natttariff faar inte vara negativ'),
  dayStartHour: z.number().int().min(0).max(23),
  dayEndHour: z.number().int().min(0).max(23),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function NatagareRequestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      dayStartHour: 6,
      dayEndHour: 22,
    },
  });

  // Generate hour options 0-23
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i.toString().padStart(2, '0') + ':00',
  }));

  const onSubmit = (data: RequestFormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createNatagare(data);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Natagare begaerd! Den aer nu synlig foer din organisation.');
        router.push('/dashboard/natagare');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {/* Info banner explaining the approval workflow */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Hur det fungerar:</strong> Din begaerda natagare blir synlig foer din
          organisation direkt och kan anvaendas i kalkyler. Super Admin graanskar och
          godkaenner foer att goera den tillgaenglig foer alla organisationer.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Namn *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="T.ex. Ellevio, Vattenfall Eldistribution"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayRateSekKw">Dagtariff (SEK/kW) *</Label>
          <Input
            id="dayRateSekKw"
            type="number"
            step="0.01"
            min="0"
            {...register('dayRateSekKw', { valueAsNumber: true })}
            placeholder="T.ex. 81.25"
          />
          {errors.dayRateSekKw && (
            <p className="text-sm text-red-600">{errors.dayRateSekKw.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nightRateSekKw">Natttariff (SEK/kW) *</Label>
          <Input
            id="nightRateSekKw"
            type="number"
            step="0.01"
            min="0"
            {...register('nightRateSekKw', { valueAsNumber: true })}
            placeholder="T.ex. 40.63"
          />
          {errors.nightRateSekKw && (
            <p className="text-sm text-red-600">{errors.nightRateSekKw.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayStartHour">Dagperiod startar (kl) *</Label>
          <select
            id="dayStartHour"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            {...register('dayStartHour', { valueAsNumber: true })}
          >
            {hourOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.dayStartHour && (
            <p className="text-sm text-red-600">{errors.dayStartHour.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dayEndHour">Dagperiod slutar (kl) *</Label>
          <select
            id="dayEndHour"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            {...register('dayEndHour', { valueAsNumber: true })}
          >
            {hourOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.dayEndHour && (
            <p className="text-sm text-red-600">{errors.dayEndHour.message}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Natttariff gaeller fraan slutet av dagperioden till boerjan av naesta dag.
      </p>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Skickar begaeran...' : 'Begaer natagare'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

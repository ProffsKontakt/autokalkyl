'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createNatagare, updateNatagare, NatagareFormData } from '@/actions/natagare';

// Form uses string inputs for numbers, validated and converted on submit
const natagareSchema = z.object({
  name: z.string().min(2, 'Namn maste vara minst 2 tecken').max(100),
  dayRateSekKw: z.number().min(0, 'Dagtariff far inte vara negativ'),
  nightRateSekKw: z.number().min(0, 'Natttariff far inte vara negativ'),
  dayStartHour: z.number().int().min(0).max(23, 'Ogiltig starttid'),
  dayEndHour: z.number().int().min(0).max(23, 'Ogiltig sluttid'),
});

type FormData = z.infer<typeof natagareSchema>;

interface NatagareFormProps {
  natagare?: {
    id: string;
    name: string;
    dayRateSekKw: number;
    nightRateSekKw: number;
    dayStartHour: number;
    dayEndHour: number;
    isDefault: boolean;
  };
}

export function NatagareForm({ natagare }: NatagareFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!natagare;
  const isDefault = natagare?.isDefault ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(natagareSchema),
    defaultValues: natagare
      ? {
          name: natagare.name,
          dayRateSekKw: natagare.dayRateSekKw,
          nightRateSekKw: natagare.nightRateSekKw,
          dayStartHour: natagare.dayStartHour,
          dayEndHour: natagare.dayEndHour,
        }
      : {
          dayStartHour: 6,
          dayEndHour: 22,
        },
  });

  // Generate hour options 0-23
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i.toString().padStart(2, '0') + ':00',
  }));

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      const submitData: NatagareFormData = {
        name: data.name,
        dayRateSekKw: data.dayRateSekKw,
        nightRateSekKw: data.nightRateSekKw,
        dayStartHour: data.dayStartHour,
        dayEndHour: data.dayEndHour,
      };

      const result = isEditing
        ? await updateNatagare(natagare.id, submitData)
        : await createNatagare(submitData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/natagare');
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

      {isDefault && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
          Detta ar en forinstalld natagare. Du kan andra priserna men inte ta bort den.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Namn *</Label>
        <Input
          id="name"
          {...register('name')}
          disabled={isDefault}
          placeholder="T.ex. Ellevio, Vattenfall Eldistribution"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        {isDefault && (
          <p className="text-xs text-gray-500">
            Forinstallda natagare kan inte byta namn.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayRateSekKw">Dagtariff (SEK/kW) *</Label>
          <Input
            id="dayRateSekKw"
            type="number"
            step="0.01"
            min="0"
            {...register('dayRateSekKw')}
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
            {...register('nightRateSekKw')}
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
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...register('dayStartHour')}
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
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...register('dayEndHour')}
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

      <p className="text-sm text-gray-600">
        Natttariff galler fran slutet av dagperioden till borjan av nasta dag.
      </p>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sparar...' : isEditing ? 'Spara andringar' : 'Skapa natagare'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBatteryConfig, updateBatteryConfig } from '@/actions/batteries';

const batteryConfigSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken').max(100),
  brandId: z.string().min(1, 'Välj ett varumärke'),
  capacityKwh: z.number().positive('Kapacitet måste vara positiv'),
  maxDischargeKw: z.number().positive('Maxeffekt urladdning måste vara positiv'),
  maxChargeKw: z.number().positive('Maxeffekt laddning måste vara positiv'),
  chargeEfficiency: z.number().min(0).max(100, 'Effektivitet måste vara 0-100%'),
  dischargeEfficiency: z.number().min(0).max(100, 'Effektivitet måste vara 0-100%'),
  warrantyYears: z.number().int().positive('Garantitid måste vara minst 1 år'),
  guaranteedCycles: z.number().int().positive('Cykler måste vara minst 1'),
  degradationPerYear: z.number().min(0).max(100, 'Degradering måste vara 0-100%'),
  costPrice: z.number().min(0, 'Inköpspris får inte vara negativt'),
  isExtensionCabinet: z.boolean(),
  isNewStack: z.boolean(),
});

type FormData = z.infer<typeof batteryConfigSchema>;

interface BatteryConfigFormProps {
  config?: {
    id: string;
    name: string;
    brandId: string;
    capacityKwh: number;
    maxDischargeKw: number;
    maxChargeKw: number;
    chargeEfficiency: number;
    dischargeEfficiency: number;
    warrantyYears: number;
    guaranteedCycles: number;
    degradationPerYear: number;
    costPrice: number;
    isExtensionCabinet: boolean;
    isNewStack: boolean;
  };
  brands: { id: string; name: string }[];
  brandId?: string; // Pre-selected brand (for create from brand page)
}

export function BatteryConfigForm({ config, brands, brandId }: BatteryConfigFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!config;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(batteryConfigSchema),
    defaultValues: config
      ? {
          name: config.name,
          brandId: config.brandId,
          capacityKwh: config.capacityKwh,
          maxDischargeKw: config.maxDischargeKw,
          maxChargeKw: config.maxChargeKw,
          chargeEfficiency: config.chargeEfficiency,
          dischargeEfficiency: config.dischargeEfficiency,
          warrantyYears: config.warrantyYears,
          guaranteedCycles: config.guaranteedCycles,
          degradationPerYear: config.degradationPerYear,
          costPrice: config.costPrice,
          isExtensionCabinet: config.isExtensionCabinet,
          isNewStack: config.isNewStack,
        }
      : {
          brandId: brandId || '',
          capacityKwh: 15,
          maxDischargeKw: 10,
          maxChargeKw: 10,
          chargeEfficiency: 95,
          dischargeEfficiency: 95,
          warrantyYears: 10,
          guaranteedCycles: 6000,
          degradationPerYear: 2.5,
          costPrice: 0,
          isExtensionCabinet: false,
          isNewStack: true,
        },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateBatteryConfig(config.id, data)
        : await createBatteryConfig(data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/batteries');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Section 1: Basic info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Grundläggande information</h3>

        <div className="space-y-2">
          <Label htmlFor="brandId">Varumärke *</Label>
          <select
            id="brandId"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...register('brandId')}
            disabled={isEditing}
          >
            <option value="">Välj varumärke</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {errors.brandId && (
            <p className="text-sm text-red-600">{errors.brandId.message}</p>
          )}
          {isEditing && (
            <p className="text-xs text-gray-500">
              Varumärke kan inte ändras efter att konfigurationen skapats.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Modellnamn *</Label>
          <Input id="name" {...register('name')} placeholder="t.ex. Power Store 15" />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
      </div>

      {/* Section 2: Power specs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Effektspecifikationer</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacityKwh">Kapacitet (kWh) *</Label>
            <Input
              id="capacityKwh"
              type="number"
              step="0.01"
              {...register('capacityKwh', { valueAsNumber: true })}
            />
            {errors.capacityKwh && (
              <p className="text-sm text-red-600">{errors.capacityKwh.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDischargeKw">Max urladdning (kW) *</Label>
            <Input
              id="maxDischargeKw"
              type="number"
              step="0.01"
              {...register('maxDischargeKw', { valueAsNumber: true })}
            />
            {errors.maxDischargeKw && (
              <p className="text-sm text-red-600">{errors.maxDischargeKw.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxChargeKw">Max laddning (kW) *</Label>
            <Input
              id="maxChargeKw"
              type="number"
              step="0.01"
              {...register('maxChargeKw', { valueAsNumber: true })}
            />
            {errors.maxChargeKw && (
              <p className="text-sm text-red-600">{errors.maxChargeKw.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Efficiency */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Effektivitet</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chargeEfficiency">Laddningseffektivitet (%) *</Label>
            <Input
              id="chargeEfficiency"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('chargeEfficiency', { valueAsNumber: true })}
            />
            {errors.chargeEfficiency && (
              <p className="text-sm text-red-600">{errors.chargeEfficiency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dischargeEfficiency">Urladdningseffektivitet (%) *</Label>
            <Input
              id="dischargeEfficiency"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('dischargeEfficiency', { valueAsNumber: true })}
            />
            {errors.dischargeEfficiency && (
              <p className="text-sm text-red-600">{errors.dischargeEfficiency.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Warranty & Lifecycle */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Garanti och livslängd</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="warrantyYears">Garantitid (år) *</Label>
            <Input
              id="warrantyYears"
              type="number"
              min="1"
              {...register('warrantyYears', { valueAsNumber: true })}
            />
            {errors.warrantyYears && (
              <p className="text-sm text-red-600">{errors.warrantyYears.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guaranteedCycles">Garanterade cykler *</Label>
            <Input
              id="guaranteedCycles"
              type="number"
              min="1"
              {...register('guaranteedCycles', { valueAsNumber: true })}
            />
            {errors.guaranteedCycles && (
              <p className="text-sm text-red-600">{errors.guaranteedCycles.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="degradationPerYear">Degradering per år (%) *</Label>
            <Input
              id="degradationPerYear"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('degradationPerYear', { valueAsNumber: true })}
            />
            {errors.degradationPerYear && (
              <p className="text-sm text-red-600">{errors.degradationPerYear.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Pricing & Flags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pris och typ</h3>

        <div className="space-y-2">
          <Label htmlFor="costPrice">Inköpspris (SEK) *</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            {...register('costPrice', { valueAsNumber: true })}
          />
          {errors.costPrice && (
            <p className="text-sm text-red-600">{errors.costPrice.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Organisationens inköpspris för detta batteri.
          </p>
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('isExtensionCabinet')}
            />
            <span className="text-sm text-gray-700">Tillbehörsskåp (expansion)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('isNewStack')}
            />
            <span className="text-sm text-gray-700">Nytt batteripaket</span>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Tillbehörsskåp är extra batterimoduler som läggs till en befintlig installation.
          Nytt batteripaket avmarkeras för renoverade/återvunna batterier.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Sparar...'
            : isEditing
              ? 'Spara ändringar'
              : 'Skapa konfiguration'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

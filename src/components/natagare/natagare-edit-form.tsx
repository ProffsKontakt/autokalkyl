'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  updateNatagareConfig,
  approveNatagare,
  rejectNatagare,
} from '@/actions/natagare';

// Peak method configuration types
interface PeakMethodConfig {
  method: 'SIMPLE_MAX' | 'N_PEAK_AVERAGE' | 'SEASONAL_PEAK';
  numPeaks?: number;
  avgPeriod?: 'month' | 'quarter' | 'winter';
  excludeWeekends?: boolean;
  timeWindows?: { start: number; end: number }[];
}

// Form validation schema
const formSchema = z.object({
  dayRateSekKw: z.number().min(0, 'Dagtariff far inte vara negativ'),
  nightRateSekKw: z.number().min(0, 'Natttariff far inte vara negativ'),
  dayStartHour: z.number().int().min(0).max(23, 'Ogiltig starttid'),
  dayEndHour: z.number().int().min(0).max(23, 'Ogiltig sluttid'),
  nightDiscountPercent: z.number().min(0).max(100).nullable(),
  peakNightStartHour: z.number().int().min(0).max(23).nullable(),
  peakNightEndHour: z.number().int().min(0).max(23).nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface NatagareEditFormProps {
  natagare: {
    id: string;
    name: string;
    dayRateSekKw: number;
    nightRateSekKw: number;
    dayStartHour: number;
    dayEndHour: number;
    peakCalculationMethod: string | null;
    nightDiscountPercent: number | null;
    peakNightStartHour: number | null;
    peakNightEndHour: number | null;
    globalScope: boolean;
    approvalStatus: string;
  };
}

export function NatagareEditForm({ natagare }: NatagareEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Parse peak method config
  const parsePeakMethod = (method: string | null): PeakMethodConfig => {
    if (!method) return { method: 'SIMPLE_MAX' };
    try {
      return JSON.parse(method) as PeakMethodConfig;
    } catch {
      return { method: (method as PeakMethodConfig['method']) || 'SIMPLE_MAX' };
    }
  };

  const [peakConfig, setPeakConfig] = useState<PeakMethodConfig>(
    parsePeakMethod(natagare.peakCalculationMethod)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dayRateSekKw: natagare.dayRateSekKw,
      nightRateSekKw: natagare.nightRateSekKw,
      dayStartHour: natagare.dayStartHour,
      dayEndHour: natagare.dayEndHour,
      nightDiscountPercent: natagare.nightDiscountPercent,
      peakNightStartHour: natagare.peakNightStartHour,
      peakNightEndHour: natagare.peakNightEndHour,
    },
  });

  const nightDiscountPercent = watch('nightDiscountPercent');
  const dayRateSekKw = watch('dayRateSekKw');

  // Hour options for select
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await updateNatagareConfig(natagare.id, {
        dayRateSekKw: data.dayRateSekKw,
        nightRateSekKw: data.nightRateSekKw,
        dayStartHour: data.dayStartHour,
        dayEndHour: data.dayEndHour,
        peakCalculationMethod: JSON.stringify(peakConfig),
        nightDiscountPercent: data.nightDiscountPercent ?? undefined,
        peakNightStartHour: data.peakNightStartHour ?? undefined,
        peakNightEndHour: data.peakNightEndHour ?? undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Natagare uppdaterad');
        router.refresh();
      }
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const result = await approveNatagare(natagare.id);
    setIsApproving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Natagare godkand');
      router.refresh();
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    const result = await rejectNatagare(natagare.id);
    setIsRejecting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Natagare avvisad');
      router.refresh();
    }
  };

  const needsApproval =
    natagare.approvalStatus === 'PENDING' ||
    natagare.approvalStatus === 'DUPLICATE_REVIEW';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with name and status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {natagare.name}
          </h2>
          <div className="flex gap-2 mt-1">
            {natagare.globalScope && natagare.approvalStatus === 'APPROVED' && (
              <Badge variant="success">Global</Badge>
            )}
            {natagare.approvalStatus === 'PENDING' && (
              <Badge variant="info">Vantande godkannande</Badge>
            )}
            {natagare.approvalStatus === 'DUPLICATE_REVIEW' && (
              <Badge variant="warning">Duplikat - granska</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Basic info section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Grundlaggande information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dayRateSekKw">Dagtariff (SEK/kW)</Label>
            <Input
              id="dayRateSekKw"
              type="number"
              step="0.01"
              {...register('dayRateSekKw', { valueAsNumber: true })}
            />
            {errors.dayRateSekKw && (
              <p className="text-sm text-red-600 mt-1">
                {errors.dayRateSekKw.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nightRateSekKw">Natttariff (SEK/kW)</Label>
            <Input
              id="nightRateSekKw"
              type="number"
              step="0.01"
              {...register('nightRateSekKw', { valueAsNumber: true })}
            />
            {errors.nightRateSekKw && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nightRateSekKw.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="dayStartHour">Dagperiod start</Label>
            <select
              id="dayStartHour"
              className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              {...register('dayStartHour', { valueAsNumber: true })}
            >
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="dayEndHour">Dagperiod slut</Label>
            <select
              id="dayEndHour"
              className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              {...register('dayEndHour', { valueAsNumber: true })}
            >
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Peak calculation method section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Effektberakningsmetod
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="peakMethod">Metod</Label>
            <select
              id="peakMethod"
              className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              value={peakConfig.method}
              onChange={(e) =>
                setPeakConfig({
                  ...peakConfig,
                  method: e.target.value as PeakMethodConfig['method'],
                })
              }
            >
              <option value="SIMPLE_MAX">Enkel max (hogsta topp)</option>
              <option value="N_PEAK_AVERAGE">
                N-topp medel (t.ex. Ellevio)
              </option>
              <option value="SEASONAL_PEAK">
                Sasongs-topp (t.ex. Vattenfall)
              </option>
            </select>
          </div>

          {/* Conditional fields for N_PEAK_AVERAGE */}
          {peakConfig.method === 'N_PEAK_AVERAGE' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <Label htmlFor="numPeaks">Antal toppar att medelvardesberakna</Label>
                <Input
                  id="numPeaks"
                  type="number"
                  min="1"
                  max="10"
                  value={peakConfig.numPeaks || 3}
                  onChange={(e) =>
                    setPeakConfig({
                      ...peakConfig,
                      numPeaks: parseInt(e.target.value) || 3,
                    })
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ellevio anvander 3 toppar
                </p>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="excludeWeekends"
                  className="w-4 h-4 rounded border-slate-300"
                  checked={peakConfig.excludeWeekends || false}
                  onChange={(e) =>
                    setPeakConfig({
                      ...peakConfig,
                      excludeWeekends: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="excludeWeekends" className="font-normal">
                  Exkludera helger
                </Label>
              </div>
            </div>
          )}

          {/* Conditional fields for SEASONAL_PEAK */}
          {peakConfig.method === 'SEASONAL_PEAK' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Label htmlFor="avgPeriod">Medelvärdesperiod</Label>
              <select
                id="avgPeriod"
                className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={peakConfig.avgPeriod || 'month'}
                onChange={(e) =>
                  setPeakConfig({
                    ...peakConfig,
                    avgPeriod: e.target.value as PeakMethodConfig['avgPeriod'],
                  })
                }
              >
                <option value="month">Manad</option>
                <option value="quarter">Kvartal</option>
                <option value="winter">Vinter (nov-mar)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Vattenfall anvander vinterperiod
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Night discount section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Nattrabatt for effekttariff
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="nightDiscountPercent">Rabatt (%)</Label>
            <Input
              id="nightDiscountPercent"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              {...register('nightDiscountPercent', {
                valueAsNumber: true,
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            />
            {errors.nightDiscountPercent && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nightDiscountPercent.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="peakNightStartHour">Natt start</Label>
            <select
              id="peakNightStartHour"
              className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              {...register('peakNightStartHour', {
                valueAsNumber: true,
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            >
              <option value="">-</option>
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="peakNightEndHour">Natt slut</Label>
            <select
              id="peakNightEndHour"
              className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              {...register('peakNightEndHour', {
                valueAsNumber: true,
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            >
              <option value="">-</option>
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        {nightDiscountPercent && nightDiscountPercent > 0 && dayRateSekKw && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              Med {nightDiscountPercent}% rabatt:
              <br />
              Effekttariff natt ={' '}
              <strong>
                {(dayRateSekKw * (1 - nightDiscountPercent / 100)).toFixed(2)}{' '}
                SEK/kW
              </strong>{' '}
              (istallet for {dayRateSekKw.toFixed(2)} SEK/kW)
            </p>
          </div>
        )}
      </section>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sparar...' : 'Spara andringar'}
        </Button>

        {needsApproval && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleApprove}
              disabled={isApproving}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {isApproving ? 'Godkanner...' : 'Godkann'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReject}
              disabled={isRejecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isRejecting ? 'Avvisar...' : 'Avvisa'}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

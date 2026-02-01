'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { NatagareEditForm } from './natagare-edit-form';

interface NatagareConfigPanelProps {
  natagare: Array<{
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
  }>;
  pendingCount: number;
}

export function NatagareConfigPanel({
  natagare,
  pendingCount,
}: NatagareConfigPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = natagare.find((n) => n.id === selectedId);

  // Parse peak method for display
  const getPeakMethodDisplay = (method: string | null): string => {
    if (!method) return 'SIMPLE_MAX';
    try {
      const config = JSON.parse(method);
      return config.method || 'SIMPLE_MAX';
    } catch {
      return method;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      {/* List (40% width) */}
      <div className="w-2/5 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <h3 className="font-medium text-slate-900 dark:text-white">
            Natagare ({natagare.length})
          </h3>
          {pendingCount > 0 && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {pendingCount} vantande godkannande
            </span>
          )}
        </div>
        {natagare.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Inga natagare hittades
          </div>
        ) : (
          natagare.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors',
                selectedId === n.id &&
                  'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600'
              )}
            >
              <div className="font-medium text-slate-900 dark:text-white">
                {n.name}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {getPeakMethodDisplay(n.peakCalculationMethod)}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {n.approvalStatus === 'DUPLICATE_REVIEW' && (
                  <Badge variant="warning">Duplikat</Badge>
                )}
                {n.approvalStatus === 'PENDING' && (
                  <Badge variant="info">Vantande</Badge>
                )}
                {n.globalScope && n.approvalStatus === 'APPROVED' && (
                  <Badge variant="success">Global</Badge>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail panel (60% width) */}
      <div className="w-3/5 p-6 overflow-y-auto bg-white dark:bg-slate-900">
        {selected ? (
          <NatagareEditForm natagare={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            Valj en natagare for att se detaljer
          </div>
        )}
      </div>
    </div>
  );
}

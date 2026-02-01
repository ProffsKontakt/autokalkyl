'use client';

import { AlertTriangle } from 'lucide-react';

interface NatagareDuplicateBannerProps {
  duplicateCount: number;
}

export function NatagareDuplicateBanner({
  duplicateCount,
}: NatagareDuplicateBannerProps) {
  if (duplicateCount === 0) return null;

  return (
    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            {duplicateCount} Duplicerade Natagare
          </h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Flera organisationer hade natagare med samma namn men olika
            konfigurationer. Granska och sla samman eller behall separata poster.
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Valj en natagare med &quot;Duplikat&quot;-markning i listan for att
            granska.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Widget showing pending natagare approvals for Super Admin dashboard.
 * Displays pending and duplicate-review natagare with count badge.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, Network } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import Link from 'next/link';

interface PendingNatagare {
  id: string;
  name: string;
  organization?: { name: string } | null;
  createdAt: Date;
  approvalStatus: string;
}

interface PendingApprovalsWidgetProps {
  pendingNatagare: PendingNatagare[];
}

export function PendingApprovalsWidget({ pendingNatagare }: PendingApprovalsWidgetProps) {
  if (pendingNatagare.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4" />
            Vaentande Natagare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Inga vaentande godkaennanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Vaentande Natagare
          </span>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-amber-500 rounded-full">
            {pendingNatagare.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {pendingNatagare.slice(0, 5).map((n) => (
            <li key={n.id} className="flex items-start gap-3 pb-3 border-b last:border-0 dark:border-gray-700">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                  {n.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {n.organization?.name || 'Okaend organisation'} •{' '}
                  {formatDistanceToNow(new Date(n.createdAt), { locale: sv, addSuffix: true })}
                </p>
                {n.approvalStatus === 'DUPLICATE_REVIEW' && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Duplicat - granska
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {pendingNatagare.length > 5 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            + {pendingNatagare.length - 5} till...
          </p>
        )}
        <Link
          href="/dashboard/admin/natagare"
          className="mt-4 block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Granska alla &rarr;
        </Link>
      </CardContent>
    </Card>
  );
}

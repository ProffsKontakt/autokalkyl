'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { deleteNatagare } from '@/actions/natagare';

interface NatagareListProps {
  natagare: Array<{
    id: string;
    name: string;
    dayRateSekKw: number;
    nightRateSekKw: number;
    dayStartHour: number;
    dayEndHour: number;
    isDefault: boolean;
    isActive: boolean;
  }>;
  userRole: string;
}

export function NatagareList({ natagare, userRole }: NatagareListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const role = userRole as Role;
  const canEdit = hasPermission(role, PERMISSIONS.NATAGARE_EDIT);
  const canDelete = hasPermission(role, PERMISSIONS.NATAGARE_DELETE);

  const formatHour = (hour: number) => hour.toString().padStart(2, '0') + ':00';

  const handleDelete = (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      setError('Förinstallerade nätägare kan inte tas bort.');
      return;
    }

    if (!confirm(`Är du säker på att du vill ta bort ${name}?`)) {
      return;
    }

    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteNatagare(id);
      setDeletingId(null);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  if (natagare.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Inga nätägare hittades. Lägg till din första nätägare för att komma igång.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Namn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dagtariff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Natttariff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dagperiod
              </th>
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {natagare.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{n.name}</span>
                    {n.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Förinstallerad
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Number(n.dayRateSekKw).toFixed(2)} SEK/kW
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Number(n.nightRateSekKw).toFixed(2)} SEK/kW
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatHour(n.dayStartHour)}-{formatHour(n.dayEndHour)}
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Link href={`/dashboard/natagare/${n.id}`}>
                          <Button size="sm" variant="outline">
                            Redigera
                          </Button>
                        </Link>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(n.id, n.name, n.isDefault)}
                          disabled={isPending && deletingId === n.id}
                        >
                          {isPending && deletingId === n.id ? 'Tar bort...' : 'Ta bort'}
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

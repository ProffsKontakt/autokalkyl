'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteBatteryBrand, deleteBatteryConfig } from '@/actions/batteries';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

interface BatteryConfig {
  id: string;
  name: string;
  capacityKwh: number;
  maxDischargeKw: number;
  maxChargeKw: number;
  warrantyYears: number;
  costPrice: number;
  isExtensionCabinet: boolean;
  isNewStack: boolean;
}

interface BatteryBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  configs: BatteryConfig[];
}

interface BatteryListProps {
  brands: BatteryBrand[];
  userRole: Role;
}

export function BatteryList({ brands, userRole }: BatteryListProps) {
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canCreate = hasPermission(userRole, PERMISSIONS.BATTERY_CREATE);
  const canEdit = hasPermission(userRole, PERMISSIONS.BATTERY_EDIT);
  const canDelete = hasPermission(userRole, PERMISSIONS.BATTERY_DELETE);

  const toggleBrand = (brandId: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    if (!confirm(`Ar du saker pa att du vill ta bort varumarket "${brandName}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBatteryBrand(brandId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDeleteConfig = (configId: string, configName: string) => {
    if (!confirm(`Ar du saker pa att du vill ta bort konfigurationen "${configName}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBatteryConfig(configId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-gray-500">
          Inga batterier att visa.
          {canCreate && (
            <p className="mt-2">
              <Link
                href="/dashboard/batteries/brands/new"
                className="text-blue-600 hover:text-blue-800"
              >
                Skapa ditt forsta varumarke
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {brands.map((brand) => {
        const isExpanded = expandedBrands.has(brand.id);

        return (
          <Card key={brand.id}>
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleBrand(brand.id)}
            >
              <div className="flex items-center gap-4">
                {brand.logoUrl && (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{brand.name}</h3>
                  <p className="text-sm text-gray-500">
                    {brand.configs.length} konfiguration{brand.configs.length !== 1 ? 'er' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canCreate && (
                  <Link
                    href={`/dashboard/batteries/configs/new?brandId=${brand.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="outline">
                      Lagg till konfiguration
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link
                    href={`/dashboard/batteries/brands/${brand.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost">
                      Redigera
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBrand(brand.id, brand.name);
                    }}
                    disabled={isPending}
                  >
                    Ta bort
                  </Button>
                )}
                <span className="ml-2 text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {isExpanded && brand.configs.length > 0 && (
              <div className="border-t bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Modell
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Kapacitet
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Max effekt
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Garanti
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Inkopspris
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Typ
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Atgarder
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {brand.configs.map((config) => (
                      <tr key={config.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {config.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {config.capacityKwh} kWh
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {config.maxDischargeKw} / {config.maxChargeKw} kW
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {config.warrantyYears} ar
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {config.costPrice.toLocaleString('sv-SE')} kr
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex gap-1">
                            {config.isExtensionCabinet && (
                              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Tillbehor
                              </span>
                            )}
                            {!config.isNewStack && (
                              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                                Atervunnet
                              </span>
                            )}
                            {!config.isExtensionCabinet && config.isNewStack && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                Nytt
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          {canEdit && (
                            <Link
                              href={`/dashboard/batteries/configs/${config.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Redigera
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteConfig(config.id, config.name)}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-800"
                            >
                              Ta bort
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isExpanded && brand.configs.length === 0 && (
              <div className="border-t p-4 text-center text-gray-500 text-sm">
                Inga konfigurationer for detta varumarke.
                {canCreate && (
                  <Link
                    href={`/dashboard/batteries/configs/new?brandId=${brand.id}`}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    Lagg till en
                  </Link>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

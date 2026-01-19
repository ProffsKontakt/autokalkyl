'use client';

import { Card } from '@/components/ui/card';
import { ELOMRADE_NAMES, priceConversion } from '@/lib/electricity/types';
import { Elomrade } from '@prisma/client';

interface QuarterlyPricesProps {
  prices: Record<Elomrade, {
    avgDayPriceOre: number;
    avgNightPriceOre: number;
    avgPriceOre: number;
    year: number;
    quarter: number;
  } | null>;
}

export function QuarterlyPrices({ prices }: QuarterlyPricesProps) {
  const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];

  const formatPrice = (ore: number) => {
    const sek = priceConversion.oreToSekKwh(ore);
    return `${sek.toFixed(2)} SEK/kWh`;
  };

  const formatQuarter = (year: number, quarter: number) => {
    return `Q${quarter} ${year}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {areas.map(area => {
        const data = prices[area];

        return (
          <Card key={area} className="p-4">
            <h3 className="font-semibold text-lg">{area}</h3>
            <p className="text-sm text-gray-600 mb-3">{ELOMRADE_NAMES[area]}</p>

            {data ? (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  {formatQuarter(data.year, data.quarter)}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Dag (06-22):</span>
                    <span className="font-medium">{formatPrice(data.avgDayPriceOre)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Natt (22-06):</span>
                    <span className="font-medium">{formatPrice(data.avgNightPriceOre)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-sm">Genomsnitt:</span>
                    <span className="font-medium">{formatPrice(data.avgPriceOre)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Ingen data tillganglig</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

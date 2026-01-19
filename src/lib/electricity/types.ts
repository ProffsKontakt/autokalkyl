import { Elomrade } from '@prisma/client';

export interface MgreyPrice {
  hour: number;
  price_sek: number; // Actually ore/kWh despite name
  price_eur: number;
  kmeans: number;
}

export interface MgreyResponse {
  date: string;
  SE1: MgreyPrice[];
  SE2: MgreyPrice[];
  SE3: MgreyPrice[];
  SE4: MgreyPrice[];
}

export const ELOMRADE_NAMES: Record<Elomrade, string> = {
  SE1: 'Norra Sverige (Lulea)',
  SE2: 'Mellersta norra Sverige (Sundsvall)',
  SE3: 'Mellersta sodra Sverige (Stockholm)',
  SE4: 'Sodra Sverige (Malmo)',
};

// Price conversion helpers
export const priceConversion = {
  // mgrey.se returns ore/kWh, store as-is
  oreToSekKwh: (ore: number) => ore / 100,
  sekKwhToOre: (sek: number) => sek * 100,
};

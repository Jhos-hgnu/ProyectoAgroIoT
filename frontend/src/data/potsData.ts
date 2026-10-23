export interface PotData {
  id: string;
  number: string;
  name: string;
  crop: string | null;
  zone: string | null;
  sector: string | null;
  battery: string | null;
  soilMoisture: number | null;
  vwcRange: string | null;
  airTemp: number | null;
  tempMin: number | null;
  tempMax: number | null;
  airHumidity: number | null;
  dpv: number | null;
  solarExposure: string | number | null;
  waterDispensed: string | null;
  waterCycles: number | null;
  waterReservoir: string | null;
  reservoirPercent: number | null;
  status: 'Optimal' | 'Stable' | 'Deficit';
  isLoading?: boolean;
  /** Solo en macetas conectadas a la API: dispositivo.conectado. */
  online?: boolean;
}

export const POTS_DATA: Record<string, PotData> = {
  '01': {
    id: '01',
    number: '01',
    name: 'Maceta 01 — Tomates Cherry',
    crop: 'Tomates Cherry',
    zone: 'ZONA A',
    sector: 'SECTOR #4',
    battery: '88% (Carga Solar)',
    soilMoisture: 72,
    vwcRange: '60-80%',
    airTemp: 24.5,
    tempMin: 18.2,
    tempMax: 27.8,
    airHumidity: 65,
    dpv: 0.95,
    solarExposure: '42.5k',
    waterDispensed: '0.45 Litros',
    waterCycles: 3,
    waterReservoir: '4.2L / 5.0L',
    reservoirPercent: 84,
    status: 'Optimal',
  },
  '02': {
    id: '02',
    number: '02',
    name: 'Maceta 02 — Albahaca Italiana',
    crop: 'Albahaca Italiana',
    zone: 'ZONA A',
    sector: 'SECTOR #2',
    battery: '94% (Red Eléctrica)',
    soilMoisture: 64,
    vwcRange: '55-75%',
    airTemp: 23.1,
    tempMin: 17.5,
    tempMax: 26.0,
    airHumidity: 58,
    dpv: 1.10,
    solarExposure: '38.0k',
    waterDispensed: '0.30 Litros',
    waterCycles: 2,
    waterReservoir: '3.8L / 5.0L',
    reservoirPercent: 76,
    status: 'Stable',
  },
  '03': {
    id: '03',
    number: '03',
    name: 'Maceta 03 — Pimientos Dulces',
    crop: 'Pimientos Dulces',
    zone: 'ZONA B',
    sector: 'SECTOR #1',
    battery: '62% (Carga Solar)',
    soilMoisture: 38,
    vwcRange: '50-70%',
    airTemp: 26.8,
    tempMin: 19.0,
    tempMax: 29.5,
    airHumidity: 48,
    dpv: 1.45,
    solarExposure: '51.2k',
    waterDispensed: '0.60 Litros',
    waterCycles: 4,
    waterReservoir: '2.1L / 5.0L',
    reservoirPercent: 42,
    status: 'Deficit',
  },
};
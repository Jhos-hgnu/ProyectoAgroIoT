import type { Alerta, Dispositivo, Mediciones, Riego } from '../types/contrato';
import type { PotData } from './potsData';

/** La API vence los riegos sin confirmar a los 2 min, pero solo al crear o entregar otro comando. */
const VENCIMIENTO_RIEGO_MS = 2 * 60 * 1000;

/** Riego PENDIENTE o ENVIADO que todavía no venció. Uno abierto de hace más de 2 min ya no bloquea. */
export function riegoAbierto(riego: Riego | null | undefined, ahora = Date.now()): boolean {
  if (!riego || (riego.estado !== 'PENDIENTE' && riego.estado !== 'ENVIADO')) return false;
  return ahora - new Date(riego.creadoEn).getTime() < VENCIMIENTO_RIEGO_MS;
}

/** Riego abierto que ya pasó los 2 min: la API lo marcará EXPIRADO en la siguiente operación. */
export function riegoVencido(riego: Riego | null | undefined, ahora = Date.now()): boolean {
  return !!riego && (riego.estado === 'PENDIENTE' || riego.estado === 'ENVIADO') && !riegoAbierto(riego, ahora);
}

function valorSensor(dispositivo: Dispositivo, tipo: string): number | null {
  return dispositivo.sensores.find((sensor) => sensor.tipo === tipo)?.ultimoValor ?? null;
}

function extremosTemperatura(mediciones: Mediciones | null): { minimo: number | null; maximo: number | null } {
  const puntos = mediciones?.series.find((serie) => serie.tipo === 'TEMPERATURA')?.puntos ?? [];
  const minimos = puntos.map((punto) => punto.min).filter((valor): valor is number => typeof valor === 'number');
  const maximos = puntos.map((punto) => punto.max).filter((valor): valor is number => typeof valor === 'number');

  return {
    minimo: minimos.length ? Math.min(...minimos) : null,
    maximo: maximos.length ? Math.max(...maximos) : null,
  };
}

/** 'maceta-02' → '02'; si el id no termina en número, se usa tal cual. */
export function numeroDeMaceta(dispositivoId: string): string {
  return /(\d+)$/.exec(dispositivoId)?.[1] ?? dispositivoId;
}

export function adaptarMaceta(
  dispositivo: Dispositivo,
  riegos: Riego[],
  alertas: Alerta[],
  mediciones: Mediciones | null,
  ahora = new Date(),
): PotData {
  const temperatura = valorSensor(dispositivo, 'TEMPERATURA');
  const humedadAire = valorSensor(dispositivo, 'HUMEDAD_AIRE');
  const { minimo, maximo } = extremosTemperatura(mediciones);
  const presionSaturacion = temperatura === null
    ? null
    : 0.6108 * Math.exp((17.27 * temperatura) / (temperatura + 237.3));
  const dpv = presionSaturacion === null || humedadAire === null
    ? null
    : Number((presionSaturacion * (1 - humedadAire / 100)).toFixed(2));
  const desde = ahora.getTime() - 24 * 60 * 60 * 1000;
  const waterCycles = riegos.filter((riego) => (
    riego.estado === 'EJECUTADO' && new Date(riego.creadoEn).getTime() >= desde
  )).length;
  const tieneAlertaImportante = alertas.some((alerta) => (
    alerta.severidad === 'CRITICA' || alerta.severidad === 'ADVERTENCIA'
  ));

  return {
    id: dispositivo.id,
    number: numeroDeMaceta(dispositivo.id),
    name: dispositivo.nombre,
    crop: dispositivo.cultivo,
    zone: dispositivo.zona ?? dispositivo.ubicacion,
    sector: dispositivo.sector,
    battery: null,
    soilMoisture: valorSensor(dispositivo, 'HUMEDAD_SUELO'),
    vwcRange: `Riego bajo ${dispositivo.umbralRiego}%`,
    airTemp: temperatura,
    tempMin: minimo,
    tempMax: maximo,
    airHumidity: humedadAire,
    dpv,
    solarExposure: valorSensor(dispositivo, 'LUZ'),
    waterDispensed: null,
    waterCycles,
    waterReservoir: null,
    reservoirPercent: null,
    online: dispositivo.conectado,
    status: tieneAlertaImportante ? 'Deficit' : alertas.length ? 'Stable' : 'Optimal',
  };
}

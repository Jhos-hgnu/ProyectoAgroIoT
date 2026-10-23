import { useEffect, useState } from 'react';
import { api } from '../api/cliente';
import type { Mediciones, Riego } from '../types/contrato';

export type RangoAnalitica = '24h' | '7d' | '30d';

export interface UseAnalitica {
  mediciones: Mediciones | null;
  /** Riegos dentro del rango, del más reciente al más antiguo. */
  riegos: Riego[];
  desde: Date;
  hasta: Date;
  cargando: boolean;
  error: string | null;
}

const HORAS_RANGO: Record<RangoAnalitica, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };

function mensajeError(error: unknown): string {
  if (error instanceof TypeError) return 'No se puede conectar con la API.';
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado al consultar la API.';
}

/**
 * Series por hora y riegos del rango para la vista de análisis.
 * Con dispositivoId null (macetas ficticias) no consulta la API.
 */
export function useAnalitica(dispositivoId: string | null, rango: RangoAnalitica): UseAnalitica {
  const [estado, setEstado] = useState<Omit<UseAnalitica, 'cargando' | 'error'>>(() => {
    const hasta = new Date();
    return { mediciones: null, riegos: [], desde: new Date(hasta.getTime() - HORAS_RANGO[rango] * 3_600_000), hasta };
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dispositivoId) return;
    let cancelado = false;
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - HORAS_RANGO[rango] * 3_600_000);
    setCargando(true);

    Promise.allSettled([
      api.mediciones(dispositivoId, { desde: desde.toISOString(), hasta: hasta.toISOString(), agrupacion: 'HORA' }),
      api.riegos(dispositivoId, 100),
    ]).then(([mediciones, riegos]) => {
      if (cancelado) return;
      setEstado({
        mediciones: mediciones.status === 'fulfilled' ? mediciones.value : null,
        riegos: riegos.status === 'fulfilled'
          ? riegos.value.filter((riego) => new Date(riego.creadoEn) >= desde)
          : [],
        desde,
        hasta,
      });
      const fallo = [mediciones, riegos].find((r) => r.status === 'rejected');
      setError(fallo && fallo.status === 'rejected' ? mensajeError(fallo.reason) : null);
      setCargando(false);
    });

    return () => {
      cancelado = true;
      setCargando(false);
    };
  }, [dispositivoId, rango]);

  if (!dispositivoId) return { ...estado, mediciones: null, riegos: [], cargando: false, error: null };
  return { ...estado, cargando, error };
}

import { useCallback, useRef, useState } from 'react';
import { ApiError, api } from '../api/cliente';
import type { Reporte } from '../types/contrato';

export interface UseReportes {
  generando: boolean;
  error: string | null;
  /** Genera un reporte de IA de las últimas `horas` horas. Devuelve null si falló (el motivo queda en `error`). */
  generar: (horas?: number) => Promise<Reporte | null>;
  limpiarError: () => void;
}

/** Gemini tarda unos segundos; pasado este tiempo se cancela la petición. */
const TIEMPO_MAXIMO_MS = 60_000;
const HORAS_MAXIMAS = 72;

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.codigo === 'DATOS_INSUFICIENTES') {
      return 'Aún no hay suficientes mediciones; prueba una ventana mayor o espera.';
    }
    if (error.codigo === 'IA_NO_DISPONIBLE') return 'El servicio de IA no está disponible; reintenta.';
    return error.message;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'El reporte tardó demasiado en generarse; reintenta.';
  }
  if (error instanceof TypeError) return 'No se pudo conectar con la API.';
  return 'Ocurrió un error inesperado al generar el reporte.';
}

export function useReportes(dispositivoId = 'maceta-01'): UseReportes {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enVuelo = useRef(false);

  const generar = useCallback(async (horas = 24) => {
    if (enVuelo.current) return null;
    enVuelo.current = true;
    setGenerando(true);
    setError(null);
    const controlador = new AbortController();
    const temporizador = window.setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
    try {
      try {
        return await api.generarReporte(dispositivoId, { horas }, controlador.signal);
      } catch (errorApi) {
        // Con pocas mediciones en la ventana pedida, se reintenta una vez con la ventana máxima.
        if (!(errorApi instanceof ApiError) || errorApi.codigo !== 'DATOS_INSUFICIENTES' || horas >= HORAS_MAXIMAS) {
          throw errorApi;
        }
        return await api.generarReporte(dispositivoId, { horas: HORAS_MAXIMAS }, controlador.signal);
      }
    } catch (errorApi) {
      setError(mensajeError(errorApi));
      return null;
    } finally {
      window.clearTimeout(temporizador);
      enVuelo.current = false;
      setGenerando(false);
    }
  }, [dispositivoId]);

  const limpiarError = useCallback(() => setError(null), []);

  return { generando, error, generar, limpiarError };
}

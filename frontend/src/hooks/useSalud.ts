import { useEffect, useState } from 'react';
import { api } from '../api/cliente';
import type { Salud } from '../types/contrato';

export interface UseSalud {
  /** null mientras no responde o si la API no está disponible. */
  salud: Salud | null;
  /** Tiempo de respuesta de GET /salud en milisegundos. */
  latenciaMs: number | null;
  /** false si la última consulta falló (API caída o despertando). */
  apiDisponible: boolean | null;
}

const INTERVALO_SALUD = 30_000;

/** Texto y color del estado de Firebase para mostrar en la interfaz. */
export function estadoFirebase({ salud, apiDisponible }: UseSalud): { texto: string; color: string } {
  if (apiDisponible === false) return { texto: 'Sin API', color: '#F87171' };
  if (!salud) return { texto: 'Consultando…', color: '#94A3B8' };
  if (salud.firebase === 'OK') return { texto: 'Conectado', color: '#38BDF8' };
  // "Inactivo" en vez de "No configurado" para que quepa en la barra lateral.
  if (salud.firebase === 'NO_CONFIGURADO') return { texto: 'Inactivo', color: '#94A3B8' };
  return { texto: 'Error', color: '#F87171' };
}

/** Estado de la API, la base de datos y Firebase (GET /salud), con su latencia. */
export function useSalud(): UseSalud {
  const [estado, setEstado] = useState<UseSalud>({ salud: null, latenciaMs: null, apiDisponible: null });

  useEffect(() => {
    let cancelado = false;
    const consultar = async () => {
      if (document.visibilityState === 'hidden') return;
      const inicio = performance.now();
      try {
        const salud = await api.salud();
        if (!cancelado) setEstado({ salud, latenciaMs: Math.round(performance.now() - inicio), apiDisponible: true });
      } catch {
        if (!cancelado) setEstado({ salud: null, latenciaMs: null, apiDisponible: false });
      }
    };
    void consultar();
    const intervalo = window.setInterval(() => void consultar(), INTERVALO_SALUD);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, []);

  return estado;
}

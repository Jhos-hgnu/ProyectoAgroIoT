import { useCallback, useState } from 'react';
import type { Riego } from '../types/contrato';

/**
 * La maceta no tiene sensor de nivel ni caudalímetro, así que el agua se estima:
 * litros = segundos de bomba de los riegos EJECUTADOS × caudal de la bomba.
 * El caudal, la capacidad y la fecha del último rellenado se guardan en este navegador.
 */
export interface ConfigTanque {
  /** Caudal de la bomba en ml por segundo (se mide llenando un vaso durante 10 s). */
  caudalMlPorSeg: number;
  capacidadL: number;
  /** Fecha ISO del último rellenado; el agua usada se cuenta desde aquí. */
  rellenadoEn: string;
}

export interface UseTanque {
  config: ConfigTanque;
  /** Agua estimada de los riegos ejecutados en las últimas 24 h, en ml. */
  mlUltimas24h: number;
  ciclosUltimas24h: number;
  litrosRestantes: number;
  porcentaje: number;
  guardar: (cambios: Partial<Omit<ConfigTanque, 'rellenadoEn'>>) => void;
  marcarRellenado: () => void;
}

const POR_DEFECTO = { caudalMlPorSeg: 1.5, capacidadL: 5 };
const DIA_MS = 24 * 60 * 60 * 1000;

const clave = (dispositivoId: string) => `agroiot-tanque-${dispositivoId}`;

function leer(dispositivoId: string): ConfigTanque {
  try {
    const guardada = JSON.parse(localStorage.getItem(clave(dispositivoId)) ?? 'null') as Partial<ConfigTanque> | null;
    if (guardada && typeof guardada.rellenadoEn === 'string') {
      return {
        caudalMlPorSeg: Number(guardada.caudalMlPorSeg) > 0 ? Number(guardada.caudalMlPorSeg) : POR_DEFECTO.caudalMlPorSeg,
        capacidadL: Number(guardada.capacidadL) > 0 ? Number(guardada.capacidadL) : POR_DEFECTO.capacidadL,
        rellenadoEn: guardada.rellenadoEn,
      };
    }
  } catch {
    // Sin almacenamiento o dato dañado: se usan los valores por defecto.
  }
  // Primera vez: se asume el tanque lleno desde ahora.
  return { ...POR_DEFECTO, rellenadoEn: new Date().toISOString() };
}

function escribir(dispositivoId: string, config: ConfigTanque): void {
  try {
    localStorage.setItem(clave(dispositivoId), JSON.stringify(config));
  } catch {
    // Sin almacenamiento (modo privado): dura hasta recargar.
  }
}

export function useTanque(dispositivoId: string, riegos: Riego[]): UseTanque {
  const [config, setConfig] = useState<ConfigTanque>(() => {
    const inicial = leer(dispositivoId);
    escribir(dispositivoId, inicial);
    return inicial;
  });

  const ahora = Date.now();
  const ejecutados = riegos.filter((riego) => riego.estado === 'EJECUTADO');
  const segundosDesde = (desde: number) => ejecutados
    .filter((riego) => new Date(riego.finalizadoEn ?? riego.creadoEn).getTime() >= desde)
    .reduce((total, riego) => total + riego.duracionSeg, 0);
  const ciclosUltimas24h = ejecutados.filter((riego) => new Date(riego.creadoEn).getTime() >= ahora - DIA_MS).length;
  const mlUltimas24h = Math.round(segundosDesde(ahora - DIA_MS) * config.caudalMlPorSeg);
  const litrosUsados = (segundosDesde(new Date(config.rellenadoEn).getTime()) * config.caudalMlPorSeg) / 1000;
  const litrosRestantes = Math.max(0, config.capacidadL - litrosUsados);
  const porcentaje = Math.round((litrosRestantes / config.capacidadL) * 100);

  const guardar = useCallback((cambios: Partial<Omit<ConfigTanque, 'rellenadoEn'>>) => {
    setConfig((actual) => {
      const siguiente = { ...actual, ...cambios };
      escribir(dispositivoId, siguiente);
      return siguiente;
    });
  }, [dispositivoId]);

  const marcarRellenado = useCallback(() => {
    setConfig((actual) => {
      const siguiente = { ...actual, rellenadoEn: new Date().toISOString() };
      escribir(dispositivoId, siguiente);
      return siguiente;
    });
  }, [dispositivoId]);

  return { config, mlUltimas24h, ciclosUltimas24h, litrosRestantes, porcentaje, guardar, marcarRellenado };
}

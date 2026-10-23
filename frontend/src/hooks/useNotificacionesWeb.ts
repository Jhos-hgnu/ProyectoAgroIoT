import { useCallback, useEffect, useRef, useState } from 'react';
import type { Alerta } from '../types/contrato';

export interface UseNotificacionesWeb {
  /** El navegador permite notificaciones (no lo hacen algunos navegadores ni las páginas sin HTTPS). */
  soportadas: boolean;
  activas: boolean;
  permiso: NotificationPermission | 'no-soportado';
  /** Activa o desactiva; al activar pide permiso al navegador. Devuelve si quedaron activas. */
  alternar: (activar: boolean) => Promise<boolean>;
}

const CLAVE_PREFERENCIA = 'agroiot-notificaciones-web';

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE_PREFERENCIA) === '1';
  } catch {
    return false;
  }
}

function guardarPreferencia(activas: boolean): void {
  try {
    localStorage.setItem(CLAVE_PREFERENCIA, activas ? '1' : '0');
  } catch {
    // Sin almacenamiento (modo privado): la preferencia dura hasta recargar.
  }
}

/**
 * Notificaciones del sistema operativo cuando llega una alerta activa nueva. Funcionan mientras el
 * dashboard está abierto (aunque la pestaña esté en segundo plano); no son push con el navegador cerrado.
 */
export function useNotificacionesWeb(alertas: Alerta[], nombreMaceta: string): UseNotificacionesWeb {
  const soportadas = typeof window !== 'undefined' && 'Notification' in window;
  const [permiso, setPermiso] = useState<UseNotificacionesWeb['permiso']>(
    soportadas ? Notification.permission : 'no-soportado',
  );
  const [preferencia, setPreferencia] = useState(leerPreferencia);
  const activas = preferencia && permiso === 'granted';
  // Alertas ya vistas; null hasta la primera respuesta para no avisar de las que ya existían.
  const vistas = useRef<Set<number> | null>(null);

  useEffect(() => {
    const activasAhora = alertas.filter((alerta) => alerta.resueltaEn === null);
    if (vistas.current === null) {
      if (alertas.length) vistas.current = new Set(activasAhora.map((alerta) => alerta.id));
      return;
    }
    for (const alerta of activasAhora) {
      if (vistas.current.has(alerta.id)) continue;
      vistas.current.add(alerta.id);
      if (!activas) continue;
      const notificacion = new Notification(`AgroIoT • ${nombreMaceta}`, {
        body: alerta.valor === null ? alerta.mensaje : `${alerta.mensaje} (valor ${alerta.valor})`,
        tag: `alerta-${alerta.id}`,
      });
      notificacion.onclick = () => {
        window.focus();
        notificacion.close();
      };
    }
  }, [alertas, activas, nombreMaceta]);

  const alternar = useCallback(async (activar: boolean) => {
    if (!soportadas) return false;
    if (!activar) {
      setPreferencia(false);
      guardarPreferencia(false);
      return false;
    }
    const resultado = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermiso(resultado);
    const ok = resultado === 'granted';
    setPreferencia(ok);
    guardarPreferencia(ok);
    return ok;
  }, [soportadas]);

  return { soportadas, activas, permiso, alternar };
}

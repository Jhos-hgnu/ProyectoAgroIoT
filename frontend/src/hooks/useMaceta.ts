import { useCallback, useEffect, useRef, useState } from 'react';
import { adaptarMaceta } from '../data/adaptador';
import type { PotData } from '../data/potsData';
import { ApiError, api } from '../api/cliente';
import type { Alerta, Dispositivo, Mediciones, Riego } from '../types/contrato';

interface Snapshot {
  dispositivo: Dispositivo | null;
  riegos: Riego[];
  alertas: Alerta[];
  mediciones: Mediciones | null;
}

export interface UseMaceta {
  pot: PotData | null;
  riego: Riego | null;
  conectado: boolean;
  tieneBomba: boolean;
  duracionRiegoSeg: number | null;
  sensores: Dispositivo['sensores'];
  cargando: boolean;
  error: string | null;
  actualizadoEn: Date | null;
  solicitandoRiego: boolean;
  regar: () => Promise<void>;
  refrescar: () => void;
}

const INTERVALO_NORMAL = 10_000;
const INTERVALO_RIEGO = 3_000;
const INTERVALO_MEDICIONES = 60_000;

function mensajeError(error: unknown): string {
  if (error instanceof TypeError) {
    return 'No se puede conectar con la API. Si está en Render, puede tardar 30–60 s en despertar.';
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado al consultar la API.';
}

export function useMaceta(dispositivoId = 'maceta-01'): UseMaceta {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    dispositivo: null,
    riegos: [],
    alertas: [],
    mediciones: null,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);
  const [solicitandoRiego, setSolicitandoRiego] = useState(false);
  const enVuelo = useRef(false);
  const enviandoRiego = useRef(false);
  const refrescarPendiente = useRef(false);
  const ultimaConsultaMediciones = useRef(0);

  const cargar = useCallback(async function cargarMaceta() {
    if (enVuelo.current) {
      refrescarPendiente.current = true;
      return;
    }
    if (document.visibilityState === 'hidden') return;
    enVuelo.current = true;

    const consultarMediciones = Date.now() - ultimaConsultaMediciones.current >= INTERVALO_MEDICIONES;
    if (consultarMediciones) ultimaConsultaMediciones.current = Date.now();
    const consultasPrincipales = Promise.allSettled([
      api.dispositivo(dispositivoId),
      api.riegos(dispositivoId, 20),
      api.alertas(dispositivoId),
    ]);
    const consultaMediciones = consultarMediciones
      ? api.mediciones(dispositivoId, {
          desde: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          agrupacion: 'HORA',
          tipos: ['TEMPERATURA'],
        }).then(
          (resultado) => ({ status: 'fulfilled' as const, value: resultado }),
          (reason: unknown) => ({ status: 'rejected' as const, reason }),
        )
      : Promise.resolve(null);

    const [resultados, resultadoMediciones] = await Promise.all([consultasPrincipales, consultaMediciones]);
    const errores: string[] = [];
    const [dispositivo, riegos, alertas] = resultados;
    const huboRespuesta = resultados.some((resultado) => resultado.status === 'fulfilled')
      || resultadoMediciones?.status === 'fulfilled';

    if (dispositivo.status === 'rejected') errores.push(mensajeError(dispositivo.reason));
    if (riegos.status === 'rejected') errores.push(mensajeError(riegos.reason));
    if (alertas.status === 'rejected') errores.push(mensajeError(alertas.reason));
    if (resultadoMediciones?.status === 'rejected') errores.push(mensajeError(resultadoMediciones.reason));
    setSnapshot((actual) => {
      const siguiente = { ...actual };

      if (dispositivo.status === 'fulfilled') {
        siguiente.dispositivo = dispositivo.value;
      }

      if (riegos.status === 'fulfilled') {
        siguiente.riegos = riegos.value;
      }

      if (alertas.status === 'fulfilled') {
        siguiente.alertas = alertas.value;
      }

      if (resultadoMediciones) {
        if (resultadoMediciones.status === 'fulfilled') {
          siguiente.mediciones = resultadoMediciones.value;
        }
      }

      return siguiente;
    });

    if (huboRespuesta) setActualizadoEn(new Date());
    setError(errores.length ? [...new Set(errores)].join(' ') : null);
    setCargando(false);
    enVuelo.current = false;
    if (refrescarPendiente.current) {
      refrescarPendiente.current = false;
      void cargarMaceta();
    }
  }, [dispositivoId]);

  const refrescar = useCallback(() => {
    void cargar();
  }, [cargar]);
  const riegoEnCurso = snapshot.riegos[0]?.estado === 'PENDIENTE' || snapshot.riegos[0]?.estado === 'ENVIADO';

  useEffect(() => {
    void cargar();
    const intervalo = window.setInterval(
      () => void cargar(),
      riegoEnCurso ? INTERVALO_RIEGO : INTERVALO_NORMAL,
    );
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') void cargar();
    };

    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [cargar, riegoEnCurso]);

  const regar = useCallback(async () => {
    const ultimoRiegoEnCurso = snapshot.riegos[0]?.estado === 'PENDIENTE'
      || snapshot.riegos[0]?.estado === 'ENVIADO';
    if (enviandoRiego.current || ultimoRiegoEnCurso || !snapshot.dispositivo?.tieneBomba) return;
    enviandoRiego.current = true;
    setSolicitandoRiego(true);
    setError(null);
    try {
      const nuevoRiego = await api.regar(dispositivoId, {
        duracionSeg: snapshot.dispositivo.duracionRiegoSeg,
      });
      setSnapshot((actual) => ({
        ...actual,
        riegos: [nuevoRiego, ...actual.riegos.filter((riego) => riego.id !== nuevoRiego.id)],
      }));
      await cargar();
    } catch (errorApi) {
      setError(errorApi instanceof ApiError ? errorApi.message : mensajeError(errorApi));
    } finally {
      enviandoRiego.current = false;
      setSolicitandoRiego(false);
    }
  }, [cargar, dispositivoId, snapshot.dispositivo, snapshot.riegos]);

  const { dispositivo, riegos, alertas, mediciones } = snapshot;
  const pot = dispositivo
    ? adaptarMaceta(dispositivo, riegos, alertas, mediciones)
    : null;

  return {
    pot,
    riego: riegos[0] ?? null,
    conectado: dispositivo?.conectado ?? false,
    tieneBomba: dispositivo?.tieneBomba ?? false,
    duracionRiegoSeg: dispositivo?.duracionRiegoSeg ?? null,
    sensores: dispositivo?.sensores ?? [],
    cargando,
    error,
    actualizadoEn,
    solicitandoRiego,
    regar,
    refrescar,
  };
}

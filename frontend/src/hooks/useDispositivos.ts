import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/cliente';
import type { Dispositivo, DispositivoCrear } from '../types/contrato';

export interface UseDispositivos {
  dispositivos: Dispositivo[];
  /** true hasta que la API responde por primera vez. */
  cargando: boolean;
  error: string | null;
  /** Registra la maceta en la API y devuelve la creada (o lanza el error de la API). */
  crear: (datos: DispositivoCrear) => Promise<Dispositivo>;
  refrescar: () => void;
}

const INTERVALO_LISTA = 15_000;

/** Lista de macetas registradas (GET /dispositivos). El detalle en vivo de cada una lo da useMaceta. */
export function useDispositivos(): UseDispositivos {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activo = useRef(true);

  const cargar = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const lista = await api.dispositivos();
      if (!activo.current) return;
      setDispositivos(lista);
      setError(null);
    } catch (e) {
      if (!activo.current) return;
      setError(e instanceof TypeError
        ? 'No se puede conectar con la API. Si está en Render, puede tardar 30–60 s en despertar.'
        : e instanceof Error ? e.message : 'No se pudo cargar la lista de macetas.');
    } finally {
      if (activo.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    activo.current = true;
    void cargar();
    const intervalo = window.setInterval(() => void cargar(), INTERVALO_LISTA);
    return () => {
      activo.current = false;
      window.clearInterval(intervalo);
    };
  }, [cargar]);

  const crear = useCallback(async (datos: DispositivoCrear) => {
    const nueva = await api.crearDispositivo(datos);
    setDispositivos((actual) => [...actual.filter((d) => d.id !== nueva.id), nueva]
      .sort((a, b) => a.id.localeCompare(b.id)));
    return nueva;
  }, []);

  return { dispositivos, cargando, error, crear, refrescar: () => void cargar() };
}

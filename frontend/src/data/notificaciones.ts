import type { Notificacion } from '../components/NotificationsDropdown';
import type { Alerta, Riego } from '../types/contrato';

const VENTANA_RIEGOS_MS = 24 * 60 * 60 * 1000;
// Los ids de riegos y del aviso de conexión se desplazan para no chocar con los de alertas.
const OFFSET_RIEGO = 1_000_000;
const ID_DESCONECTADO = 2_000_000;

function haceCuanto(fechaIso: string, ahora: number): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(fechaIso).getTime()) / 60_000));
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return horas < 24 ? `Hace ${horas} h` : `Hace ${Math.floor(horas / 24)} d`;
}

function textoRiego(riego: Riego): { titulo: string; mensaje: string } | null {
  const origen = riego.origen === 'AUTOMATICO' ? 'automático' : 'manual';
  switch (riego.estado) {
    case 'EJECUTADO':
      return { titulo: `Riego ${origen} ejecutado`, mensaje: `La bomba funcionó ${riego.duracionSeg} s.` };
    case 'FALLIDO':
      return { titulo: `Riego ${origen} fallido`, mensaje: 'La maceta reportó un fallo al regar.' };
    case 'EXPIRADO':
      return { titulo: `Riego ${origen} sin confirmar`, mensaje: 'La maceta no confirmó el riego a tiempo.' };
    default:
      return null;
  }
}

/** Notificaciones de la maceta conectada a la API: alertas activas, riegos de las últimas 24 h y desconexión. */
export function notificacionesDeMaceta(
  nombre: string,
  alertas: Alerta[],
  riegos: Riego[],
  conectado: boolean,
  ahora = Date.now(),
): Notificacion[] {
  const notificaciones: Notificacion[] = [];

  if (!conectado) {
    notificaciones.push({
      id: ID_DESCONECTADO,
      titulo: 'Nodo desconectado',
      mensaje: `${nombre} no ha enviado lecturas recientemente.`,
      tiempo: 'Ahora',
      tipo: 'sistema',
      vistaDestino: 'devices',
    });
  }

  for (const alerta of alertas.filter((a) => a.resueltaEn === null).slice(0, 5)) {
    notificaciones.push({
      id: alerta.id,
      titulo: alerta.mensaje,
      mensaje: alerta.valor === null ? nombre : `${nombre}: valor registrado ${alerta.valor}.`,
      tiempo: haceCuanto(alerta.creadaEn, ahora),
      tipo: 'alerta',
      vistaDestino: 'alerts',
    });
  }

  const riegosRecientes = riegos.filter((r) => ahora - new Date(r.creadoEn).getTime() <= VENTANA_RIEGOS_MS);
  for (const riego of riegosRecientes.slice(0, 3)) {
    const texto = textoRiego(riego);
    if (!texto) continue;
    notificaciones.push({
      id: OFFSET_RIEGO + riego.id,
      titulo: texto.titulo,
      mensaje: `${nombre}: ${texto.mensaje}`,
      tiempo: haceCuanto(riego.finalizadoEn ?? riego.creadoEn, ahora),
      tipo: 'riego',
      vistaDestino: 'analytics',
    });
  }

  return notificaciones;
}

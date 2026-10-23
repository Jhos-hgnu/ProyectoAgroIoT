import type { Alerta, ConsultaMediciones, Dispositivo, DispositivoPatch, ErrorApi, FiltroAlertas, Mediciones, Reporte, ReporteRequest, ReporteResumen, Riego, RiegoRequest, Salud, } from '../types/contrato'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '')

/** Error HTTP de la API con el formato { codigo, mensaje, timestamp } del contrato. */
export class ApiError extends Error {
  readonly status: number
  readonly codigo: ErrorApi['codigo']
  readonly timestamp: string | null

  constructor(status: number, cuerpo: ErrorApi | null) {
    super(cuerpo?.mensaje ?? `Error HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.codigo = cuerpo?.codigo ?? `HTTP_${status}`
    this.timestamp = cuerpo?.timestamp ?? null
  }
}

function esErrorApi(x: unknown): x is ErrorApi {
  return typeof x === 'object' && x !== null && 'codigo' in x && 'mensaje' in x
}

/**
 * fetch contra VITE_API_URL. Devuelve el JSON o lanza ApiError si la respuesta no es 2xx.
 * Los fallos de red (API caída, CORS) se propagan como TypeError de fetch.
 */
export async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${BASE_URL}${ruta}`, { ...init, headers })

  if (!res.ok) {
    const cuerpo: unknown = await res.json().catch(() => null)
    throw new ApiError(res.status, esErrorApi(cuerpo) ? cuerpo : null)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

function query(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

const id = encodeURIComponent

// --- Endpoints que usa el frontend ---

export const api = {
  salud: () => pedir<Salud>('/salud'),

  dispositivo: (dispositivoId: string) => pedir<Dispositivo>(`/dispositivos/${id(dispositivoId)}`),

  actualizarDispositivo: (dispositivoId: string, cambios: DispositivoPatch) =>
    pedir<Dispositivo>(`/dispositivos/${id(dispositivoId)}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    }),

  mediciones: (dispositivoId: string, c: ConsultaMediciones = {}) =>
    pedir<Mediciones>(
      `/dispositivos/${id(dispositivoId)}/mediciones` +
        query({ desde: c.desde, hasta: c.hasta, tipos: c.tipos?.join(','), agrupacion: c.agrupacion }),
    ),

  regar: (dispositivoId: string, req: RiegoRequest = {}) =>
    pedir<Riego>(`/dispositivos/${id(dispositivoId)}/riegos`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  riegos: (dispositivoId: string, limite = 20) =>
    pedir<Riego[]>(`/dispositivos/${id(dispositivoId)}/riegos` + query({ limite: String(limite) })),

  alertas: (dispositivoId: string, estado: FiltroAlertas = 'ACTIVA') =>
    pedir<Alerta[]>(`/dispositivos/${id(dispositivoId)}/alertas` + query({ estado })),

  resolverAlerta: (alertaId: number) => pedir<Alerta>(`/alertas/${alertaId}/resolver`, { method: 'POST' }),

  generarReporte: (dispositivoId: string, req: ReporteRequest = {}, signal?: AbortSignal) =>
    pedir<Reporte>(`/dispositivos/${id(dispositivoId)}/reportes`, {
      method: 'POST',
      body: JSON.stringify(req),
      signal,
    }),

  reportes: (dispositivoId: string) => pedir<ReporteResumen[]>(`/dispositivos/${id(dispositivoId)}/reportes`),

  reporte: (reporteId: number) => pedir<Reporte>(`/reportes/${reporteId}`),
}

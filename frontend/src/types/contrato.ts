// Tipos del contrato de la API de AgroIoT (docs/contrato-api.md).
// Reflejan exactamente los JSON de la API. Las fechas son strings ISO-8601 en UTC con "Z";
// en Firebase, milisegundos desde 1970 (number).

/** Fecha ISO-8601 en UTC, p. ej. "2026-10-16T16:20:05Z". */
export type FechaIso = string

// ---------------------------------------------------------------------
// Catálogos y códigos
// ---------------------------------------------------------------------

/** Tipos de sensor conocidos. Se acepta cualquier string para no romper si se agrega uno nuevo. */
export type TipoSensor = 'HUMEDAD_SUELO' | 'TEMPERATURA' | 'HUMEDAD_AIRE' | 'LUZ' | (string & {})

export type EstadoSensor = 'ACTIVO' | 'SIN_DATOS'
export type MotivoDescarte = 'TIPO_DESCONOCIDO' | 'FUERA_DE_RANGO' | 'DUPLICADO'
export type OrigenRiego = 'MANUAL' | 'AUTOMATICO'
export type EstadoRiego = 'PENDIENTE' | 'ENVIADO' | 'EJECUTADO' | 'FALLIDO' | 'EXPIRADO'
export type Severidad = 'INFO' | 'ADVERTENCIA' | 'CRITICA'
export type Agrupacion = 'NINGUNA' | 'HORA'
export type FiltroAlertas = 'ACTIVA' | 'TODAS'

export type CodigoError =
  | 'VALIDACION'
  | 'NO_AUTORIZADO'
  | 'DISPOSITIVO_NO_ENCONTRADO'
  | 'COMANDO_NO_ENCONTRADO'
  | 'ALERTA_NO_ENCONTRADA'
  | 'REPORTE_NO_ENCONTRADO'
  | 'RIEGO_EN_CURSO'
  | 'BOMBA_NO_DISPONIBLE'
  | 'COMANDO_NO_ENVIADO'
  | 'SIN_MEDICIONES_VALIDAS'
  | 'DATOS_INSUFICIENTES'
  | 'NO_IMPLEMENTADO'
  | 'IA_NO_DISPONIBLE'
  | (string & {})

/** Formato único de error de la API. */
export interface ErrorApi {
  codigo: CodigoError
  mensaje: string
  timestamp: FechaIso
}

// ---------------------------------------------------------------------
// GET /salud
// ---------------------------------------------------------------------

export interface Salud {
  estado: 'OK' | 'DEGRADADO'
  baseDatos: 'OK' | 'ERROR'
  firebase: 'OK' | 'ERROR' | 'NO_CONFIGURADO'
  hora: FechaIso
}

// ---------------------------------------------------------------------
// POST /lecturas (lo usa el ESP32; se tipa por completitud)
// ---------------------------------------------------------------------

export interface MedicionEntrada {
  tipo: TipoSensor
  valor: number
}

export interface LecturaRequest {
  dispositivoId: string
  /** Opcional: si falta, la API usa su propia hora. */
  medidaEn?: FechaIso
  mediciones: MedicionEntrada[]
}

export interface MedicionDescartada {
  tipo: string
  valor: number
  motivo: MotivoDescarte
}

export interface ComandoEntregado {
  id: number
  accion: 'REGAR'
  duracionSeg: number
}

export interface LecturaResponse {
  lecturaId: number
  aceptadas: TipoSensor[]
  descartadas: MedicionDescartada[]
  comando: ComandoEntregado | null
}

// ---------------------------------------------------------------------
// POST /comandos/{comandoId}/confirmacion (ESP32)
// ---------------------------------------------------------------------

export interface ConfirmacionRequest {
  dispositivoId: string
  estado: 'EJECUTADO' | 'FALLIDO'
  detalle: string | null
}

export interface ConfirmacionResponse {
  id: number
  estado: EstadoRiego
}

// ---------------------------------------------------------------------
// GET /dispositivos/{id} y PATCH /dispositivos/{id}
// ---------------------------------------------------------------------

export interface SensorDetectado {
  tipo: TipoSensor
  nombre: string
  unidad: string
  ultimoValor: number | null
  ultimaLectura: FechaIso
  estado: EstadoSensor
}

export interface Dispositivo {
  id: string
  nombre: string
  ubicacion: string | null
  cultivo: string | null
  zona: string | null
  sector: string | null
  tieneBomba: boolean
  riegoAutomatico: boolean
  /** Hay bomba y el sensor de suelo está ACTIVO. */
  riegoAutomaticoDisponible: boolean
  umbralRiego: number
  duracionRiegoSeg: number
  esperaRiegoMin: number
  ultimaConexion: FechaIso | null
  conectado: boolean
  /** Solo los sensores que han enviado datos alguna vez. */
  sensores: SensorDetectado[]
}

/** POST /dispositivos: el id y el nombre los genera la API. */
export interface DispositivoCrear {
  cultivo: string
  zona?: string
  sector?: string
  /** Por defecto true. */
  tieneBomba?: boolean
}

/** Solo los campos a cambiar. */
export interface DispositivoPatch {
  riegoAutomatico?: boolean
  /** 0–100 */
  umbralRiego?: number
  /** 1–60 */
  duracionRiegoSeg?: number
  /** ≥ 0 */
  esperaRiegoMin?: number
  tieneBomba?: boolean
}

// ---------------------------------------------------------------------
// GET /dispositivos/{id}/mediciones
// ---------------------------------------------------------------------

export interface ConsultaMediciones {
  desde?: FechaIso
  hasta?: FechaIso
  tipos?: TipoSensor[]
  agrupacion?: Agrupacion
}

export interface Punto {
  t: FechaIso
  /** Con agrupacion HORA es el promedio. */
  valor: number
  /** Solo con agrupacion HORA. */
  min?: number
  /** Solo con agrupacion HORA. */
  max?: number
}

export interface Serie {
  tipo: TipoSensor
  unidad: string
  puntos: Punto[]
}

export interface Mediciones {
  dispositivoId: string
  desde: FechaIso
  hasta: FechaIso
  agrupacion: Agrupacion
  /** Solo vienen las series con datos. */
  series: Serie[]
}

// ---------------------------------------------------------------------
// Riegos
// ---------------------------------------------------------------------

export interface RiegoRequest {
  /** Si falta, se usa la duración configurada. */
  duracionSeg?: number
}

export interface Riego {
  id: number
  origen: OrigenRiego
  estado: EstadoRiego
  duracionSeg: number
  humedadSueloAntes: number | null
  creadoEn: FechaIso
  finalizadoEn: FechaIso | null
}

// ---------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------

export interface Alerta {
  id: number
  /** null en alertas del sistema (p. ej. riego fallido). */
  tipoSensor: TipoSensor | null
  severidad: Severidad
  mensaje: string
  valor: number | null
  creadaEn: FechaIso
  /** null = alerta activa. */
  resueltaEn: FechaIso | null
}

// ---------------------------------------------------------------------
// Reportes de IA
// ---------------------------------------------------------------------

export interface ReporteRequest {
  /** 1–72, por defecto 24. */
  horas?: number
}

export interface Reporte {
  id: number
  desde: FechaIso
  hasta: FechaIso
  sensores: TipoSensor[]
  sensoresSinDatos: TipoSensor[]
  /** Markdown. */
  contenido: string
  modelo: string
  creadoEn: FechaIso
}

/** Elemento de GET /dispositivos/{id}/reportes (sin contenido). */
export type ReporteResumen = Omit<Reporte, 'contenido'>

// ---------------------------------------------------------------------
// Firebase Realtime Database: /dispositivos/{id}
// ---------------------------------------------------------------------

/** Milisegundos desde 1970. */
export type FechaMs = number

export interface FirebaseRiego {
  estado: EstadoRiego
  comandoId: number
  origen: OrigenRiego
  actualizadoEn: FechaMs
}

export interface FirebaseSensor {
  valor: number
  unidad: string
  actualizadoEn: FechaMs
}

export interface FirebaseAlerta {
  tipoSensor: TipoSensor | null
  severidad: Severidad
  mensaje: string
  valor: number | null
  creadaEn: FechaMs
}

export interface FirebaseDispositivo {
  nombre: string
  tieneBomba: boolean
  riegoAutomatico: boolean
  umbralRiego: number
  ultimaConexion?: FechaMs
  riego?: FirebaseRiego
  /** Un nodo por sensor que ha enviado datos; nunca se asumen los cuatro. */
  sensores?: Record<string, FirebaseSensor>
  /** Llave = id de la alerta. */
  alertasActivas?: Record<string, FirebaseAlerta>
}

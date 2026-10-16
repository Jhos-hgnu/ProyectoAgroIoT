// Ejemplos JSON del contrato (docs/contrato-api.md), tipados contra src/types/contrato.ts.
import type {
  Alerta,
  ConfirmacionRequest,
  ConfirmacionResponse,
  Dispositivo,
  DispositivoPatch,
  ErrorApi,
  FirebaseDispositivo,
  LecturaRequest,
  LecturaResponse,
  Mediciones,
  Reporte,
  Riego,
  Salud,
} from '../types/contrato'

import alertasJson from './alertas.json'
import confirmacionJson from './confirmacion.json'
import dispositivoPatchJson from './dispositivo-patch.json'
import dispositivoJson from './dispositivo.json'
import errorJson from './error.json'
import firebaseJson from './firebase.json'
import lecturaRequestJson from './lectura-request.json'
import lecturaResponseDescartadaJson from './lectura-response-descartada.json'
import lecturaResponseJson from './lectura-response.json'
import medicionesJson from './mediciones.json'
import reporteJson from './reporte.json'
import riegoJson from './riego.json'
import saludJson from './salud.json'

// JSON importado tiene tipos amplios (string en vez de uniones); se convierte al tipo del contrato.
export const mockSalud = saludJson as Salud
export const mockError = errorJson as ErrorApi
export const mockLecturaRequest = lecturaRequestJson as LecturaRequest
export const mockLecturaResponse = lecturaResponseJson as LecturaResponse
export const mockLecturaResponseDescartada = lecturaResponseDescartadaJson as LecturaResponse
export const mockConfirmacionRequest = confirmacionJson.request as ConfirmacionRequest
export const mockConfirmacionResponse = confirmacionJson.response as ConfirmacionResponse
export const mockDispositivo = dispositivoJson as Dispositivo
export const mockDispositivoPatch = dispositivoPatchJson as DispositivoPatch
export const mockMediciones = medicionesJson as Mediciones
export const mockRiego = riegoJson as Riego
export const mockAlertas = alertasJson as Alerta[]
export const mockReporte = reporteJson as Reporte
export const mockFirebase = firebaseJson.dispositivos['maceta-01'] as FirebaseDispositivo

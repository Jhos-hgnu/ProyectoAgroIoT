#!/usr/bin/env node
// Simulador del ESP32 de AgroIoT. Habla con la API igual que el firmware: POST /lecturas con
// X-Api-Key y, si la respuesta trae un comando de riego, lo "ejecuta" y lo confirma.
// Uso: node simulador.mjs <salud|historial|vivo> [opciones]   (node simulador.mjs --ayuda)

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import { ApiError, crearCliente } from './src/api.mjs'
import { ESCENARIOS, SENSORES, UNIDADES, crearMaceta } from './src/maceta.mjs'

const AYUDA = `
Simulador del ESP32 de AgroIoT

  node simulador.mjs salud
      Comprueba que la API responde.

  node simulador.mjs historial [--horas 24] [--cada 5] [--sensores ...]
      Carga lecturas pasadas (con medidaEn) para llenar gráficas y reportes.
      No disparan alertas ni riegos: la API las trata como historial.

  node simulador.mjs vivo [--intervalo 10] [--sensores ...] [--escenario normal]
                          [--confirmacion ok] [--suelo 42] [--lecturas N]
      Envía una lectura cada --intervalo segundos, como el ESP32 real. Ctrl+C para parar.

Opciones
  --sensores      Lista separada por comas. Por defecto, los cuatro.
                  Acepta códigos o alias: suelo, temp, aire, luz.
  --escenario     normal | seco (el suelo se seca rápido) | calor (temperatura > 32 °C).
  --confirmacion  Qué hace con un comando de riego: ok (EJECUTADO), falla (FALLIDO)
                  o nunca (no confirma; la API lo marca EXPIRADO a los 2 min).
  --suelo         Humedad del suelo inicial en modo vivo (%).
  --lecturas      Detenerse después de N lecturas.

Configuración (variables de entorno o simulador/.env; si falta, se lee backend/.env)
  API_URL         Por defecto http://localhost:8080/api
  DEVICE_API_KEY  La misma clave que usa la API.
  DISPOSITIVO_ID  Por defecto maceta-01
`

const ALIAS = { suelo: 'HUMEDAD_SUELO', temp: 'TEMPERATURA', aire: 'HUMEDAD_AIRE', luz: 'LUZ' }
const CORTO = { HUMEDAD_SUELO: 'suelo', TEMPERATURA: 'temp', HUMEDAD_AIRE: 'aire', LUZ: 'luz' }
const CONFIRMACIONES = ['ok', 'falla', 'nunca']

const horaLocal = new Intl.DateTimeFormat('es-GT', {
  timeZone: 'America/Guatemala',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
const log = (texto) => console.log(`${horaLocal.format(new Date())}  ${texto}`)
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

function salir(mensaje) {
  console.error(`\nError: ${mensaje}`)
  process.exit(1)
}

// ---------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------

function cargarEntorno() {
  // loadEnvFile no sobrescribe variables ya definidas: manda el entorno, luego simulador/.env,
  // luego backend/.env (así en local la clave se escribe una sola vez).
  for (const archivo of [join(import.meta.dirname, '.env'), join(import.meta.dirname, '..', 'backend', '.env')]) {
    if (existsSync(archivo)) process.loadEnvFile(archivo)
  }
  const apiKey = process.env.DEVICE_API_KEY
  if (!apiKey) salir('falta DEVICE_API_KEY (copia simulador/.env.example como simulador/.env)')
  return {
    apiUrl: process.env.API_URL || 'http://localhost:8080/api',
    apiKey,
    dispositivoId: process.env.DISPOSITIVO_ID || 'maceta-01',
  }
}

function leerArgumentos() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      ayuda: { type: 'boolean', short: 'h' },
      sensores: { type: 'string' },
      horas: { type: 'string', default: '24' },
      cada: { type: 'string', default: '5' },
      intervalo: { type: 'string', default: '10' },
      escenario: { type: 'string', default: 'normal' },
      confirmacion: { type: 'string', default: 'ok' },
      suelo: { type: 'string' },
      lecturas: { type: 'string' },
    },
  })
  const numero = (nombre, min, max) => {
    const n = Number(values[nombre])
    if (!Number.isFinite(n) || n < min || n > max) salir(`--${nombre} debe estar entre ${min} y ${max}`)
    return n
  }
  if (!CONFIRMACIONES.includes(values.confirmacion)) salir(`--confirmacion: ${CONFIRMACIONES.join(' | ')}`)
  if (!ESCENARIOS.includes(values.escenario)) salir(`--escenario: ${ESCENARIOS.join(' | ')}`)

  return {
    modo: positionals[0],
    ayuda: values.ayuda,
    sensores: leerSensores(values.sensores),
    // La API rechaza medidaEn de más de 7 días.
    horas: numero('horas', 1, 7 * 24 - 1),
    cada: numero('cada', 1, 60),
    intervalo: numero('intervalo', 1, 3600),
    escenario: values.escenario,
    confirmacion: values.confirmacion,
    suelo: values.suelo === undefined ? undefined : numero('suelo', 0, 100),
    lecturas: values.lecturas === undefined ? Infinity : numero('lecturas', 1, 1e9),
  }
}

function leerSensores(texto) {
  if (!texto) return SENSORES
  const lista = texto.split(',').map((s) => s.trim()).filter(Boolean)
  const codigos = lista.map((s) => ALIAS[s.toLowerCase()] ?? s.toUpperCase())
  const desconocido = codigos.find((c) => !SENSORES.includes(c))
  if (desconocido) salir(`sensor desconocido "${desconocido}". Usa: ${SENSORES.join(', ')}`)
  return [...new Set(codigos)]
}

// ---------------------------------------------------------------------
// Utilidades de la API
// ---------------------------------------------------------------------

/** Errores que no se arreglan reintentando: se detiene el simulador. */
function esFatal(e) {
  return e instanceof ApiError && (e.status === 401 || e.codigo === 'DISPOSITIVO_NO_ENCONTRADO')
}

function describirError(e) {
  if (e instanceof ApiError) return `${e.status} ${e.codigo}: ${e.message}`
  return `la API no responde (${e.cause?.code ?? e.message})`
}

const formatear = (valores) =>
  Object.entries(valores)
    .map(([tipo, v]) => `${CORTO[tipo]} ${v} ${UNIDADES[tipo]}`)
    .join('  ')

// ---------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------

async function modoSalud(api, config) {
  try {
    const s = await api.salud()
    log(`API ${config.apiUrl} → estado ${s.estado}, base de datos ${s.baseDatos}, firebase ${s.firebase}`)
  } catch (e) {
    salir(describirError(e))
  }
}

/** Lecturas pasadas, de la más antigua a la más reciente, terminando 3 min antes de ahora. */
async function modoHistorial(api, config, op) {
  const pasoMs = op.cada * 60_000
  const fin = Date.now() - 3 * 60_000 // > 2 min: la API la trata como historial
  const inicio = fin - op.horas * 3_600_000
  const total = Math.floor((fin - inicio) / pasoMs) + 1
  const maceta = crearMaceta({ suelo: op.suelo ?? 68, inicio: new Date(inicio) })

  log(`Historial: ${total} lecturas de ${op.horas} h (una cada ${op.cada} min) de ${op.sensores.join(', ')}`)
  let enviadas = 0
  let errores = 0
  let ultimoAviso = 0
  for (let i = 0; i < total; i++) {
    const medidaEn = new Date(inicio + i * pasoMs)
    const valores = maceta.medir(medidaEn)
    const mediciones = op.sensores.map((tipo) => ({ tipo, valor: valores[tipo] }))
    try {
      await api.enviarLectura({ dispositivoId: config.dispositivoId, medidaEn: medidaEn.toISOString(), mediciones })
      enviadas++
    } catch (e) {
      if (esFatal(e) || !(e instanceof ApiError)) salir(describirError(e))
      errores++
      log(`  lectura de ${medidaEn.toISOString()} rechazada: ${describirError(e)}`)
    }
    const porcentaje = Math.floor(((i + 1) / total) * 100)
    if (porcentaje >= ultimoAviso + 10) {
      ultimoAviso = porcentaje - (porcentaje % 10)
      log(`  ${String(ultimoAviso).padStart(3)} %  (${i + 1}/${total})`)
    }
  }
  log(`Listo: ${enviadas} lecturas guardadas, ${errores} con error.`)
}

/** Una lectura cada `intervalo` segundos, sin medidaEn (la API usa su hora), como el ESP32. */
async function modoVivo(api, config, op) {
  const sueloInicial = op.suelo ?? (op.escenario === 'seco' ? 38 : 42)
  const maceta = crearMaceta({ escenario: op.escenario, suelo: sueloInicial })
  const enCurso = new Set() // comandos que se están "regando" ahora
  const atendidos = new Set() // ids ya recibidos, para no ejecutar uno dos veces
  const stats = { lecturas: 0, errores: 0, riegos: 0 }

  log(
    `En vivo: ${op.sensores.join(', ')} cada ${op.intervalo} s · escenario ${op.escenario}` +
      ` · confirmación ${op.confirmacion} · ${config.apiUrl}`,
  )

  async function atenderComando(comando) {
    log(`  >> comando #${comando.id}: REGAR ${comando.duracionSeg} s`)
    await dormir(comando.duracionSeg * 1000)
    if (op.confirmacion === 'nunca') {
      log(`  >> comando #${comando.id}: no se confirma (la API lo marcará EXPIRADO)`)
      return
    }
    const ejecutado = op.confirmacion === 'ok'
    if (ejecutado) maceta.regar(comando.duracionSeg)
    try {
      const r = await api.confirmar(comando.id, {
        dispositivoId: config.dispositivoId,
        estado: ejecutado ? 'EJECUTADO' : 'FALLIDO',
        detalle: ejecutado ? null : 'Simulador: la bomba no se activó',
      })
      stats.riegos++
      log(`  >> comando #${comando.id}: confirmado ${r.estado}`)
    } catch (e) {
      log(`  >> comando #${comando.id}: la confirmación falló: ${describirError(e)}`)
    }
  }

  async function enviar() {
    const valores = maceta.medir(new Date())
    const mediciones = op.sensores.map((tipo) => ({ tipo, valor: valores[tipo] }))
    const enviados = Object.fromEntries(mediciones.map((m) => [m.tipo, m.valor]))
    try {
      const r = await api.enviarLectura({ dispositivoId: config.dispositivoId, mediciones })
      stats.lecturas++
      const descartes = r.descartadas.map((d) => ` · descartada ${d.tipo} (${d.motivo})`).join('')
      log(`#${r.lecturaId}  ${formatear(enviados)}${descartes}`)
      if (r.comando && !atendidos.has(r.comando.id)) {
        atendidos.add(r.comando.id)
        const p = atenderComando(r.comando).finally(() => enCurso.delete(p))
        enCurso.add(p)
      }
    } catch (e) {
      if (esFatal(e)) salir(describirError(e))
      stats.errores++
      log(`sin guardar  ${formatear(enviados)} · ${describirError(e)}`)
    }
  }

  const resumen = () =>
    log(`Fin: ${stats.lecturas} lecturas, ${stats.riegos} riegos confirmados, ${stats.errores} errores.`)
  process.on('SIGINT', () => {
    console.log()
    resumen()
    process.exit(0)
  })

  for (let n = 0; n < op.lecturas; n++) {
    const t0 = Date.now()
    await enviar()
    if (n + 1 < op.lecturas) await dormir(Math.max(0, op.intervalo * 1000 - (Date.now() - t0)))
  }
  await Promise.all(enCurso) // deja terminar los riegos en curso antes de salir
  resumen()
}

// ---------------------------------------------------------------------

const op = leerArgumentos()
if (op.ayuda || !['salud', 'historial', 'vivo'].includes(op.modo)) {
  console.log(AYUDA)
  process.exit(op.ayuda ? 0 : 1)
}
const config = cargarEntorno()
const api = crearCliente(config)

if (op.modo === 'salud') await modoSalud(api, config)
if (op.modo === 'historial') await modoHistorial(api, config, op)
if (op.modo === 'vivo') await modoVivo(api, config, op)

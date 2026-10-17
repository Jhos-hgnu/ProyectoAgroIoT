// Modelo simple de la maceta: produce valores creíbles para cada sensor según la hora del día.
// No pretende ser física exacta, solo que las gráficas y las reglas de la API tengan algo realista.

export const SENSORES = ['HUMEDAD_SUELO', 'TEMPERATURA', 'HUMEDAD_AIRE', 'LUZ']
export const UNIDADES = { HUMEDAD_SUELO: '%', TEMPERATURA: '°C', HUMEDAD_AIRE: '%', LUZ: '%' }
export const ESCENARIOS = ['normal', 'seco', 'calor']

const HORA_MS = 3_600_000

/** Cuánto sube la humedad del suelo por cada segundo de bomba. */
const SUELO_POR_SEG_RIEGO = 4

/** Hora del día en Guatemala (UTC−6, sin horario de verano) como número decimal, 0 a 24. */
export function horaGuatemala(fecha) {
  return (((fecha.getTime() / HORA_MS - 6) % 24) + 24) % 24
}

const ruido = (amplitud) => (Math.random() - 0.5) * amplitud
const limitar = (v, min, max) => Math.min(max, Math.max(min, v))
const redondear = (v) => Math.round(v * 100) / 100

/**
 * @param {object} op
 * @param {'normal'|'seco'|'calor'} op.escenario
 *   normal: el suelo se seca despacio (≈1.5 %/h).
 *   seco:   el suelo se seca rápido (≈0.08 %/s) para cruzar el umbral de riego en un par de minutos.
 *   calor:  la temperatura sube 12 °C en el primer minuto (dispara la alerta de temperatura alta).
 * @param {number} op.suelo  Humedad del suelo inicial (%).
 * @param {Date}   op.inicio Momento en que empieza la simulación.
 */
export function crearMaceta({ escenario = 'normal', suelo = 45, inicio = new Date() } = {}) {
  let humedadSuelo = suelo
  let ultimaFecha = inicio

  /** Pérdida de humedad del suelo por hora; con calor se seca más rápido. */
  function secadoPorHora(temperatura) {
    if (escenario === 'seco') return 0.08 * 3600
    return 1.5 * (1 + Math.max(0, temperatura - 25) / 10)
  }

  function temperatura(fecha) {
    const h = horaGuatemala(fecha)
    // Mínimo ≈17 °C a las 3:00, máximo ≈29 °C a las 15:00.
    let t = 23 + 6 * Math.sin((2 * Math.PI * (h - 9)) / 24)
    if (escenario === 'calor') {
      const minutos = (fecha - inicio) / 60_000
      t += 12 * limitar(minutos, 0, 1)
    }
    return t
  }

  function humedadAire(fecha) {
    // Al revés que la temperatura: más húmedo de madrugada.
    return 66 - 14 * Math.sin((2 * Math.PI * (horaGuatemala(fecha) - 9)) / 24)
  }

  function luz(fecha) {
    const h = horaGuatemala(fecha)
    if (h < 6 || h > 18) return Math.random()
    return 90 * Math.sin((Math.PI * (h - 6)) / 12)
  }

  return {
    /** Valores de los 4 sensores en `fecha`. Avanza el secado del suelo desde la medición anterior. */
    medir(fecha) {
      const t = temperatura(fecha)
      const horas = Math.max(0, (fecha - ultimaFecha) / HORA_MS)
      humedadSuelo = limitar(humedadSuelo - secadoPorHora(t) * horas, 5, 95)
      ultimaFecha = fecha
      return {
        HUMEDAD_SUELO: redondear(limitar(humedadSuelo + ruido(0.6), 0, 100)),
        TEMPERATURA: redondear(limitar(t + ruido(0.4), -10, 60)),
        HUMEDAD_AIRE: redondear(limitar(humedadAire(fecha) + ruido(2), 0, 100)),
        LUZ: redondear(limitar(luz(fecha) + ruido(3), 0, 100)),
      }
    },

    /** La bomba funcionó `duracionSeg` segundos: sube la humedad del suelo. */
    regar(duracionSeg) {
      humedadSuelo = limitar(humedadSuelo + duracionSeg * SUELO_POR_SEG_RIEGO, 0, 85)
    },
  }
}

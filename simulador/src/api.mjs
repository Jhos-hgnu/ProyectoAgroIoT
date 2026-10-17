// Cliente HTTP mínimo para los endpoints que usa el ESP32 (docs/contrato-api.md).

/** Error con el formato { codigo, mensaje, timestamp } del contrato. */
export class ApiError extends Error {
  constructor(status, cuerpo) {
    super(cuerpo?.mensaje ?? `HTTP ${status}`)
    this.status = status
    this.codigo = cuerpo?.codigo ?? `HTTP_${status}`
  }
}

export function crearCliente({ apiUrl, apiKey }) {
  const base = apiUrl.replace(/\/+$/, '')

  async function pedir(metodo, ruta, cuerpo) {
    const res = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
    const texto = await res.text()
    const json = texto ? JSON.parse(texto) : null
    if (!res.ok) throw new ApiError(res.status, json)
    return json
  }

  return {
    salud: () => pedir('GET', '/salud'),
    /** POST /lecturas → { lecturaId, aceptadas, descartadas, comando } */
    enviarLectura: (lectura) => pedir('POST', '/lecturas', lectura),
    /** POST /comandos/{id}/confirmacion, estado = EJECUTADO | FALLIDO */
    confirmar: (comandoId, confirmacion) => pedir('POST', `/comandos/${comandoId}/confirmacion`, confirmacion),
  }
}

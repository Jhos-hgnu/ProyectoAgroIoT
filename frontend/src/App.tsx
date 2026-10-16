import { useEffect, useState } from 'react'
import { api, ApiError } from './api/cliente'
import { mockDispositivo } from './mocks'
import type { Dispositivo, SensorDetectado } from './types/contrato'

const DISPOSITIVO_ID = 'maceta-01'

type Origen = 'api' | 'mock'

function App() {
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null)
  const [origen, setOrigen] = useState<Origen>('api')
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    api
      .dispositivo(DISPOSITIVO_ID)
      .then((d) => {
        if (cancelado) return
        setDispositivo(d)
        setOrigen('api')
      })
      .catch((e: unknown) => {
        if (cancelado) return
        // Si la API no responde (o responde error), se muestran los datos de ejemplo del contrato.
        setAviso(e instanceof ApiError ? `${e.codigo}: ${e.message}` : 'La API no responde')
        setDispositivo(mockDispositivo)
        setOrigen('mock')
      })
    return () => {
      cancelado = true
    }
  }, [])

  if (!dispositivo) return <p>Cargando…</p>

  return (
    <main>
      <h1>{dispositivo.nombre}</h1>
      <p>
        {dispositivo.conectado ? 'Conectado' : 'Desconectado'}
        {origen === 'mock' && <> · Datos de ejemplo ({aviso})</>}
      </p>

      {dispositivo.sensores.length === 0 ? (
        <p>Este dispositivo todavía no ha enviado mediciones.</p>
      ) : (
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {/* Una tarjeta por sensor que llegó de la API: nunca cuatro fijas. */}
          {dispositivo.sensores.map((s) => (
            <TarjetaSensor key={s.tipo} sensor={s} />
          ))}
        </section>
      )}
    </main>
  )
}

function TarjetaSensor({ sensor }: { sensor: SensorDetectado }) {
  const activo = sensor.estado === 'ACTIVO'
  return (
    <article style={{ border: '1px solid #999', padding: 12, minWidth: 160, opacity: activo ? 1 : 0.5 }}>
      <h2 style={{ fontSize: '1rem', margin: 0 }}>{sensor.nombre}</h2>
      <p style={{ fontSize: '1.5rem', margin: '8px 0' }}>
        {sensor.ultimoValor ?? '—'} {sensor.unidad}
      </p>
      <p style={{ margin: 0 }}>{sensor.estado}</p>
    </article>
  )
}

export default App

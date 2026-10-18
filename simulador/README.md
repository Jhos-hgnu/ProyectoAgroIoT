# AgroIoT — simulador del ESP32

Hace de ESP32 mientras no tengamos la electrónica. Para la API es indistinguible del firmware: envía `POST /lecturas` con `X-Api-Key` y, si la respuesta trae un comando de riego, espera la duración y lo confirma con `POST /comandos/{id}/confirmacion`.

Node 20.12 o superior, sin `npm install` (no tiene dependencias).

```bash
cd simulador
cp .env.example .env        # opcional: si no existe, toma DEVICE_API_KEY de backend/.env

node simulador.mjs salud                        # ¿responde la API?
node simulador.mjs historial                    # 24 h de lecturas pasadas (una cada 5 min)
node simulador.mjs vivo                         # una lectura cada 10 s; Ctrl+C para parar
node simulador.mjs --ayuda                      # todas las opciones
```

## Opciones útiles para la demo

| Quiero mostrar… | Comando |
| --- | --- |
| Que funciona con un solo sensor | `node simulador.mjs vivo --sensores suelo` |
| Solo el DHT22 | `node simulador.mjs vivo --sensores temp,aire` |
| Riego automático (el suelo baja de 35 % en ~40 s) | `node simulador.mjs vivo --escenario seco` |
| Alerta de temperatura alta (> 32 °C en ~1 min) | `node simulador.mjs vivo --escenario calor` |
| Riego que falla (alerta crítica) | `node simulador.mjs vivo --confirmacion falla` |
| Riego que nunca se confirma (`EXPIRADO`) | `node simulador.mjs vivo --confirmacion nunca` |
| Gráficas de una semana | `node simulador.mjs historial --horas 167 --cada 15` |

Alias de sensores: `suelo`, `temp`, `aire`, `luz` (o los códigos `HUMEDAD_SUELO`, etc.).

## Cómo se comporta

- **Valores:** `src/maceta.mjs` genera valores creíbles según la hora de Guatemala. La temperatura sube de día, la humedad del aire baja de día, la luz solo hay entre las 6:00 y las 18:00, y el suelo se seca poco a poco y sube cuando se riega.
- **historial:** manda `medidaEn` y termina 3 minutos antes de ahora. Así la API las trata como lecturas históricas: se guardan para las gráficas y la IA, pero no disparan alertas ni riegos.
- **vivo:** no manda `medidaEn` (igual que el ESP32), así que la API usa su hora y aplica todas las reglas de tiempo real.
- **Errores:**
  - Si la clave es incorrecta (401) o el dispositivo no existe (404), el simulador se detiene.
  - Cualquier otro error, incluida una API caída, se muestra y el simulador sigue intentando, como haría el ESP32.

## Para repetir el riego automático en la demo

La API no crea un riego automático si hubo otro riego (manual o automático) en los últimos `esperaRiegoMin` minutos, que por defecto son 10. Para repetirlo varias veces seguidas, baja la espera con `PATCH /dispositivos/maceta-01` y `{ "esperaRiegoMin": 0 }`, y al terminar vuelve a ponerla en 10. Las peticiones están en `docs/demo.http`.

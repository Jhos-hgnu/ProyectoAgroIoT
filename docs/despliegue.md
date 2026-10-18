# Despliegue: Neon + Render

La API va en Render (servicio web con `backend/Dockerfile`) y la base en Neon (PostgreSQL). El frontend puede ir en Render como sitio estático. Firebase y Gemini son opcionales: sin sus variables, la API funciona igual (ver [`contrato-api.md`](contrato-api.md)).

Orden recomendado: **1. Neon → 2. API en Render → 3. Frontend → 4. CORS**, porque cada paso necesita la URL del anterior.

## 1. Base de datos en Neon

1. Crea un proyecto en [neon.tech](https://neon.tech). Elige la región de AWS más cercana a la que vayas a usar en Render (por ejemplo, **US East (Ohio)** con Render **Ohio**), para que cada consulta no cruce el continente.
2. En **Connection Details**, copia la cadena de conexión **directa** (sin `-pooler` en el host). La API ya tiene su propio pool de 5 conexiones.
3. Carga el esquema y los datos iniciales. Usa una de estas dos formas:
   - En el **SQL Editor** de Neon, pega el contenido de `db/schema.sql` y ejecútalo.
   - Desde una terminal con `psql`: `psql "<cadena de Neon>" -f db/schema.sql`.

   > `db/schema.sql` empieza con `DROP TABLE`: ejecutarlo otra vez **borra todos los datos**. Hazlo solo con la base vacía.

4. Pasa la cadena de Neon al formato que usa la API. Neon da:

   ```text
   postgresql://<usuario>:<contraseña>@<host>.neon.tech/<base>?sslmode=require&channel_binding=require
   ```

   y la API necesita tres variables:

   | Variable | Valor |
   | --- | --- |
   | `DB_URL` | `jdbc:postgresql://<host>.neon.tech/<base>?sslmode=require` |
   | `DB_USER` | `<usuario>` |
   | `DB_PASSWORD` | `<contraseña>` |

   El usuario y la contraseña van aparte, no dentro de `DB_URL`.

El plan gratuito de Neon suspende la base tras unos minutos sin uso; la primera consulta después tarda alrededor de un segundo más. La API reintenta la conexión sola.

## 2. API en Render

1. En [render.com](https://render.com): **New → Web Service** y conecta el repositorio de GitHub.
2. Configura el servicio:

   | Campo | Valor |
   | --- | --- |
   | Branch | La rama que tenga el backend (hoy `backend/mvp-api`; lo normal es fusionarla antes a `main`) |
   | Root Directory | `backend` |
   | Runtime / Language | **Docker** (usa `backend/Dockerfile`) |
   | Region | La misma zona que Neon |
   | Instance Type | **Free** (ver "Plan gratuito" abajo) |
   | Health Check Path | `/api/salud` |

3. En **Environment**, agrega las variables:

   | Variable | Obligatoria | Valor |
   | --- | --- | --- |
   | `DB_URL`, `DB_USER`, `DB_PASSWORD` | Sí | Las del paso 1 |
   | `DEVICE_API_KEY` | Sí | Una clave nueva y larga, no la de tu `.env` local (por ejemplo, `openssl rand -hex 24`). La misma va en el ESP32 y en el simulador |
   | `CORS_ORIGINS` | Sí | La URL del frontend (paso 4). Mientras tanto, `http://localhost:5173` |
   | `GEMINI_API_KEY` | No | Key de Google AI Studio. Sin ella, los reportes responden 502 |
   | `GEMINI_MODEL` | No | Solo si no quieres `gemini-2.5-flash` |
   | `FIREBASE_DB_URL` | No | `https://<proyecto>-default-rtdb.firebaseio.com` |
   | `FIREBASE_CREDENTIALS` | No | El **JSON completo** de la llave de service account, pegado tal cual. En Render sí funciona porque es una variable de entorno, no un archivo `.properties` |

   `PORT` no hace falta: Render la pone sola y la API la usa.

4. **Create Web Service.** La primera construcción tarda varios minutos (descarga dependencias y genera el archivo CDS). Cuando termine:

   ```bash
   curl https://<servicio>.onrender.com/api/salud
   ```

   Debe responder `"baseDatos": "OK"`. `firebase` dice `NO_CONFIGURADO` si no pusiste sus variables.

5. Prueba con el simulador desde tu computadora, en `simulador/.env`:

   ```properties
   API_URL=https://<servicio>.onrender.com/api
   DEVICE_API_KEY=<la clave de Render>
   ```

   y ejecuta `node simulador.mjs salud`, luego `node simulador.mjs historial` y `node simulador.mjs vivo`.

## 3. Frontend en Render (sitio estático)

1. **New → Static Site** con el mismo repositorio.
2. Root Directory `frontend`, Build Command `npm ci && npm run build`, Publish Directory `dist`.
3. Variable `VITE_API_URL=https://<servicio>.onrender.com/api`. Vite la incrusta al construir: si cambia, hay que volver a desplegar el sitio.

## 4. CORS

Con la URL del sitio estático (por ejemplo `https://agroiot.onrender.com`), cambia `CORS_ORIGINS` en la API. Se pueden poner varias separadas por coma: `https://agroiot.onrender.com,http://localhost:5173`. Render reinicia la API al guardar.

## Plan gratuito de Render

Medido en local con los límites del plan gratuito (`docker run --memory=512m --cpus=0.1`):

| | Antes de la fase 7 | Con la imagen actual |
| --- | --- | --- |
| Arranque | 122 s | 44 s |
| Memoria al arrancar | 242 MB | 171 MB |
| Memoria bajo carga (simulador cada 1 s + consultas y reportes) | — | unos 206 MB, estable |
| Primera petición tras arrancar | 6 s | 2,4 s |
| Peticiones siguientes | | 0,05–0,25 s |

**Cabe en el plan gratuito.** El heap está limitado al 60 % de la memoria (unos 300 MB), así que aun con el heap lleno queda margen dentro de 512 MB. Lo que sí hay que tener en cuenta:

- **Se duerme tras 15 min sin peticiones.** Al despertar tarda lo que el arranque (unos 45 s en la prueba local; en Render puede variar) y la primera petición del ESP32 o del dashboard espera ese tiempo. Mientras el ESP32 envíe cada 10 s, no se duerme.
- **Antes de una demo**, abre `/api/salud` un minuto antes para despertarla.
- **750 horas al mes** por cuenta: alcanzan para un solo servicio encendido todo el mes.
- Si los 45 s de arranque molestan, un plan de pago con más CPU arranca mucho más rápido; la memoria no es el problema.

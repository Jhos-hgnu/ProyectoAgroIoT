# AgroIoT — Conectar el dashboard a la API (fase A del frontend)

Instrucciones para quien desarrolla el frontend, escritas para dárselas tal cual a un agente de IA.
Estimación: **un día de trabajo (6–8 h)**.

Fuente de verdad de los datos: [`contrato-api.md`](contrato-api.md). No se cambia el contrato ni el backend en esta tarea: si falta algo, se marca "Próximamente" y se avisa al equipo.

## Objetivo

Hoy el dashboard muestra datos fijos (`src/data/potsData.ts`). Al terminar, `maceta-01` debe mostrar datos reales de la API, actualizados cada 10 s, y el botón de riego debe crear un riego de verdad.

Decisiones ya tomadas por el equipo:

1. **Los campos que la API no tiene se muestran como "Próximamente"**, sin ocultarlos y sin inventar valores.
2. **Solo `maceta-01` se conecta a la API.** Las macetas 02, 03 y las que se agreguen desde el modal conservan datos ficticios; cambiar de maceta nunca debe consultar la API por ellas.
3. **Polling cada 10 s.** Más adelante se reemplazará por Firebase (fase 5 del backend). Por eso el acceso a datos debe quedar en **un solo hook**, para que ese cambio no toque los componentes.

## Antes de empezar: entorno local

```bash
# 1. Base de datos y API (ver README de la raíz)
docker compose up -d
cd backend && set -a && . ./.env && set +a && ./mvnw spring-boot:run

# 2. Datos: 24 h de historial y luego lecturas en vivo cada 10 s
cd simulador
node simulador.mjs historial
node simulador.mjs vivo

# 3. Frontend
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:8080/api
npm ci                    # obligatorio tras el merge: trae react-bootstrap
npm run dev               # http://localhost:5173 (único origen permitido por CORS en local)
```

`docs/demo.http` tiene todas las peticiones de la API para probarlas a mano.

## Arquitectura a implementar

```
src/
├── api/cliente.ts          (ya existe)  fetch tipado contra la API; no se modifica
├── types/contrato.ts       (ya existe)  tipos exactos del contrato; no se modifica
├── data/adaptador.ts       (NUEVO)      API → PotData (funciones puras, sin React)
├── hooks/useMaceta.ts      (NUEVO)      polling + estado; único lugar que llama a la API
└── components/...          (se ajustan) reciben PotData y callbacks; nunca llaman a la API
```

### 1. `hooks/useMaceta.ts`: el único punto de acceso a datos

Este hook es lo que después se cambiará por Firebase, así que su **interfaz no debe depender de cómo se obtienen los datos**:

```ts
interface UseMaceta {
  pot: PotData | null           // null solo en la primera carga
  riego: RiegoEstado            // ver sección "Riego"
  cargando: boolean             // primera carga
  error: string | null          // último error; los datos anteriores se conservan
  actualizadoEn: Date | null    // para mostrar "Actualizado hace X s"
  regar: () => Promise<void>    // POST /riegos y refresco inmediato
  refrescar: () => void
}
export function useMaceta(dispositivoId = 'maceta-01'): UseMaceta
```

| Llamada (`api.*` de `cliente.ts`)                                             | Frecuencia | Para qué                                             |
|-------------------------------------------------------------------------------|------------|------------------------------------------------------|
| `api.dispositivo('maceta-01')`                                                | cada 10 s  | Valores, estado de sensores, conexión, configuración |
| `api.riegos('maceta-01', 20)`                                                 | cada 10 s  | Estado del último riego y ciclos de las últimas 24 h |
| `api.alertas('maceta-01')`                                                    | cada 10 s  | Estado general de la maceta                          |
| `api.mediciones('maceta-01', { agrupacion: 'HORA', tipos: ['TEMPERATURA'] })` | cada 60 s  | Mínimo y máximo de temperatura en 24 h               |

Reglas del polling:

- Las 3 llamadas de cada ciclo van en paralelo (`Promise.allSettled`): si una falla, las otras se muestran igual.
- `setInterval` con limpieza en el `return` del `useEffect`. Se pausa cuando la pestaña está oculta (`document.visibilitychange`) y se refresca al volver.
- Tras `regar()`, se refresca de inmediato. Mientras haya un riego abierto (`PENDIENTE` o `ENVIADO`), el refresco pasa a ser cada 3 s, para que se vea el cambio de estado.
- **Un error nunca deja la pantalla en blanco:** se conservan los últimos datos y se muestra un aviso. Si el `fetch` lanza `TypeError`, la API no responde: "No se puede conectar con la API". En Render, tras dormir, la API tarda 30–60 s en despertar: "La API está despertando…".

### 2. `data/adaptador.ts`: de la API a `PotData`

Funciones puras (fáciles de probar) que arman el `PotData` que ya usan los componentes.

**Cambio de tipo:** en `PotData`, los campos marcados como "Próximamente" en la tabla pasan a aceptar `null`. Los valores de sensores también pueden ser `null`, porque el sensor puede no existir.

| Campo de `PotData`                   | Fuente                                                                    | Notas                                                                                           |
|--------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `id`, `number`                       | `'01'` fijo                                                               | —                                                                                               |
| `name`                               | `dispositivo.nombre`                                                      | "Maceta 01"                                                                                     |
| `zone`                               | `dispositivo.ubicacion`                                                   | "Laboratorio"; `null` → "Próximamente"                                                          |
| `crop`, `sector`                     | —                                                                         | **Próximamente**                                                                                |
| `battery`                            | —                                                                         | **Próximamente**                                                                                |
| `soilMoisture`                       | sensor `HUMEDAD_SUELO` → `ultimoValor`                                    | Ver "Sensores"                                                                                  |
| `vwcRange`                           | `dispositivo.umbralRiego`                                                 | Texto `Riego bajo ${umbralRiego}%`                                                              |
| `airTemp`                            | sensor `TEMPERATURA` → `ultimoValor`                                      | —                                                                                               |
| `tempMin`, `tempMax`                 | `mediciones` por hora → mínimo de los `min` y máximo de los `max`         | Si no hay serie → `null`                                                                        |
| `airHumidity`                        | sensor `HUMEDAD_AIRE` → `ultimoValor`                                     | —                                                                                               |
| `dpv`                                | **Se calcula**: `0.6108 · e^(17.27·T / (T + 237.3)) · (1 − HR/100)` (kPa) | Necesita temperatura y humedad del aire; si falta una → `null`                                  |
| `solarExposure`                      | sensor `LUZ` → `ultimoValor`                                              | Es **%** (0 = oscuridad, 100 = luz directa), no lux: cambiar la etiqueta del widget             |
| `waterCycles`                        | riegos `EJECUTADO` con `creadoEn` en las últimas 24 h                     | —                                                                                               |
| `waterDispensed`                     | —                                                                         | **Próximamente** (la API no mide litros)                                                        |
| `waterReservoir`, `reservoirPercent` | —                                                                         | **Próximamente** (no hay sensor de depósito)                                                    |
| `status`                             | alertas activas                                                           | Alguna `CRITICA` o `ADVERTENCIA` → `'Deficit'`; solo `INFO` → `'Stable'`; ninguna → `'Optimal'` |

Además del `PotData`, el hook expone `conectado` (`dispositivo.conectado`), `tieneBomba` y `duracionRiegoSeg`.

### 3. Componentes: cambios uno por uno

| Componente         | Cambio                                                                                                                                                                                                                               |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `App.tsx`          | Usar `useMaceta()` para `maceta-01` y sustituir solo sus datos mock cuando la API responde. Conservar `POTS_DATA` y `handleAddPot` para las macetas ficticias. Mostrar carga o error si la maceta 01 aún no tiene datos.                  |
| `HeaderOverview`   | Mostrar "Conectado" o "Desconectado" (`dispositivo.conectado`) y "Actualizado hace X s". El botón "Dosis Manual 100ml" pasa a ser **"Regar ahora (5 s)"**, con la duración tomada de `duracionRiegoSeg`. `battery` → "Próximamente". |
| `MetricsWidgets`   | Ver "Sensores". El widget de luz pasa de "42.5k" a "Luz 63 %". `dpv` y `tempMin`/`tempMax` en `null` → "—".                                                                                                                          |
| `IrrigationStatus` | Estado real del último riego (ver "Riego"). "Ciclos (24 h)" real. Litros y depósito → "Próximamente".                                                                                                                                |
| `PotsSummary`      | Mantener las macetas ficticias; la fila de `maceta-01` muestra su `status` real cuando llegan datos de la API.                                                                                                                      |
| `Topbar`           | Mantener el selector y el modal para macetas ficticias. Solo la selección `01` muestra datos reales y usa endpoints de la API.                                                                                                      |
| `AddPotModal`      | Se conserva accesible; las macetas que agrega siguen siendo ficticias y no llaman a la API.                                                                                                                                         |
| `data/potsData.ts` | Se conserva para las macetas ficticias y la interfaz compartida `PotData`.                                                                                                                                                          |
| `Login`            | Sin cambios (no hay autenticación en el MVP).                                                                                                                                                                                        |

Para "Próximamente" usar **un solo componente** (`<Proximamente />`: texto gris pequeño), y no textos sueltos repetidos.

#### Sensores (regla del contrato)

El contrato pide dibujar las tarjetas **según los sensores que devuelve la API, nunca cuatro fijas**:

- **El sensor no está en `dispositivo.sensores`** (nunca envió datos): **no se muestra** su widget. El diseño de 4 columnas debe acomodarse a 1, 2 o 3.
- **El sensor tiene `estado: 'SIN_DATOS'`** (no envía hace más de 2 min): el widget se muestra **en gris** con "Sin datos" y la hora de `ultimaLectura`.
- **El sensor tiene `estado: 'ACTIVO'`**: se muestra normal.

Las fechas se muestran en **hora de Guatemala**: `new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', timeStyle: 'short' })`.

#### Riego

El estado del riego se toma del riego **más reciente**: el primer elemento de `api.riegos(...)`, que viene ordenado del más reciente al más antiguo.

| `estado` del último riego | Texto en `IrrigationStatus`             | Botón "Regar ahora"       |
|---------------------------|-----------------------------------------|---------------------------|
| `PENDIENTE`               | "En cola: esperando a la maceta"        | Deshabilitado, "Regando…" |
| `ENVIADO`                 | "Regando…" (animación actual)           | Deshabilitado             |
| `EJECUTADO`               | "Último riego: hh:mm ✓"                 | Habilitado                |
| `FALLIDO`                 | "Último riego falló" (rojo)             | Habilitado                |
| `EXPIRADO`                | "La maceta no confirmó el riego" (gris) | Habilitado                |
| (sin riegos)              | "Sin riegos todavía"                    | Habilitado                |

- El botón queda **deshabilitado si `tieneBomba` es `false`**, con el texto "Sin bomba".
- Si `POST /riegos` responde 409, se muestra `error.message` de `ApiError` (viene en español desde la API). Códigos: `RIEGO_EN_CURSO` y `BOMBA_NO_DISPONIBLE`.
- La animación de "regando" **ya no usa el `setTimeout` de 3,5 s** de `OverviewView`: depende del estado real.

## Fuera de alcance (fase B, más adelante)

- Gráficas de historial.
- Formulario de configuración (`PATCH`).
- Pantalla de alertas con "Resolver".
- Las pestañas Dispositivos, Analíticas y Configuración.
- Varias macetas conectadas a la API.
- Firebase.

No hace falta tocarlas ahora.

## Criterios de aceptación (probar con el simulador)

- [ ] Con `node simulador.mjs vivo`, los valores cambian cada 10 s sin recargar la página.
- [ ] Con `node simulador.mjs vivo --sensores suelo`, a los 2 min los otros widgets se ven en gris con "Sin datos".
- [ ] "Regar ahora" pasa por En cola → Regando → Último riego ✓, y "Ciclos (24 h)" sube en 1.
- [ ] Pulsar "Regar ahora" dos veces seguidas no rompe nada: el botón se deshabilita, y si llega un 409 se ve el mensaje.
- [ ] Con `PATCH { "tieneBomba": false }` (desde `demo.http`), el botón muestra "Sin bomba". Después, volver a ponerlo en `true`.
- [ ] Con `node simulador.mjs vivo --escenario calor`, en aproximadamente 1 min el estado pasa a "Deficit" (alerta de temperatura alta) y vuelve a "Optimal" al usar `--escenario normal`.
- [ ] Al detener el simulador, a los 60 s aparece "Desconectado".
- [ ] Al detener la API, aparece el aviso de conexión **y se siguen viendo los últimos datos**. Al levantarla de nuevo, se recupera sola.
- [ ] Batería, cultivo, sector, litros y depósito dicen "Próximamente".
- [ ] `npm run build` y `npm run lint` pasan.
- [ ] Ningún componente importa `api/cliente.ts`: solo lo hace `useMaceta`.

## Orden sugerido de trabajo (un commit por paso)

1. `adaptador.ts` + cambio de tipo en `PotData` + componente `<Proximamente />` (1–2 h).
2. `useMaceta.ts` con polling y conexión en `App.tsx`: métricas reales (2 h).
3. Riego real en `HeaderOverview`, `IrrigationStatus` y `OverviewView` (1–2 h).
4. Sensores ausentes o `SIN_DATOS`, estados de carga y error, `Topbar` y `PotsSummary` con una maceta (1–2 h).
5. Recorrer los criterios de aceptación con el simulador.

## Instrucción sugerida para el agente

> Lee `docs/frontend-mvp.md`, `docs/contrato-api.md`, `frontend/src/api/cliente.ts` y `frontend/src/types/contrato.ts`. Implementa la fase A del documento en `frontend/`, siguiendo el "Orden sugerido de trabajo" con un commit por paso. No modifiques `cliente.ts`, `contrato.ts`, el backend ni el contrato. Mantén el estilo visual actual (Bootstrap y colores existentes). Al terminar, recorre los "Criterios de aceptación" con la API y el simulador corriendo, y dime cuáles pasan y cuáles no.

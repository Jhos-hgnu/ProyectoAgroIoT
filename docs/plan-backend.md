# AgroIoT — Plan de fases del backend

Rama de trabajo: `backend/mvp-api` (creada desde `develop`). Cada fase termina con un PR a `develop`.

Fuente de verdad de endpoints, JSON y reglas: [`contrato-api.md`](contrato-api.md). Este plan solo ordena el trabajo.

## Objetivo inmediato: demo de la API sin electrónica

Todavía no tenemos el ESP32 ni los sensores, así que un **simulador** hace de ESP32: envía lecturas, recibe el comando de riego y lo confirma. Para el contrato, el simulador y el ESP32 son iguales, así que lo que se demuestre con él funcionará con el hardware.

**El MVP de la demo son las fases 1 a 4.** Con ellas, la API queda completa para el dashboard: lecturas, historial para gráficas, configuración, riego manual y automático con su ciclo completo, y alertas. Firebase, la IA y el despliegue (fases 5 a 7) quedan para después de la presentación, salvo que sobre tiempo.

## Estado actual (fase 0, ya hecha)

| Pieza | Estado |
| --- | --- |
| Estructura Spring Boot, entidades JPA y repositorios de las 9 tablas | Hecho |
| Formato único de error (`ApiException` + `GlobalExceptionHandler`) | Hecho |
| `X-Api-Key` en los endpoints del ESP32 (`ApiKeyFilter`) | Hecho |
| CORS configurable con `CORS_ORIGINS` | Hecho |
| `GET /salud` | Hecho (Firebase siempre `NO_CONFIGURADO`) |
| `POST /lecturas` | Hecho, salvo el paso 5 (alertas, riego automático y Firebase) |
| `GET /dispositivos/{id}` | Hecho |
| Resto de endpoints | Responden 501 `NO_IMPLEMENTADO` |
| Pruebas | Solo `ApiApplicationTests` (arranque del contexto) |

## Fases

Cada fase lista **qué se hace**, **dónde** y **cuándo está terminada**. "Terminada" significa que se puede mostrar con el simulador o con `docs/demo.http`, no solo que compila.

### Fase 1 — Simulador y datos de demo · MVP

Sin esto no hay demo, así que va primero.

- [ ] `simulador/` con un script en Node 20, sin dependencias, porque `fetch` ya viene incluido. Toma la URL de la API y la `X-Api-Key` de variables de entorno.
  - Modo **en vivo**: una lectura cada 10 s con valores que varían de forma realista. Por ejemplo, la humedad del suelo baja poco a poco y sube después de un riego.
  - Modo **historial**: carga 24 h de lecturas con `medidaEn` para que las gráficas y el reporte tengan datos.
  - Opción `--sensores` para elegir qué sensores envía (`HUMEDAD_SUELO`, `TEMPERATURA,HUMEDAD_AIRE`, etc.) y así mostrar los modos con sensores parciales del contrato.
  - Si la respuesta de `/lecturas` trae `comando`, espera `duracionSeg` y lo confirma con `POST /comandos/{id}/confirmacion`. Con una opción, el simulador puede fallar o no confirmar, para mostrar los estados `FALLIDO` y `EXPIRADO`.
- [ ] `docs/demo.http`: peticiones listas para ejecutar desde VS Code (REST Client) o IntelliJ, una por cada endpoint, incluidos los casos de error (401, 404, 409, 422).
- [ ] README de `simulador/` con los comandos.

**Terminada cuando:** con la base vacía, `simulador historial` y luego `simulador vivo` llenan la base, y `GET /dispositivos/maceta-01` muestra los sensores enviados como `ACTIVO` y `conectado: true`.

### Fase 2 — Consultas del dashboard · MVP

Corresponde al orden 2 y 5 del contrato.

- [ ] `GET /dispositivos/{id}/mediciones`:
  - Sin agrupar usa la consulta 4 de `db/consultas.sql`; por hora usa la consulta 1, que da promedio, `min` y `max`.
  - Si faltan `desde` o `hasta`, toma las últimas 24 h. También acepta el filtro `tipos`.
  - Devuelve solo las series que tienen datos.
- [ ] `PATCH /dispositivos/{id}`: validar los rangos (umbral de 0 a 100, duración de 1 a 60, espera ≥ 0) y responder con el dispositivo completo, reutilizando `DispositivoService.obtener`.
- [ ] Ampliar `ApiException` con los códigos que falten.

**Terminada cuando:** con el historial de la fase 1, la consulta con `agrupacion=HORA` devuelve unas 24 filas por sensor, y un `PATCH` con `umbralRiego: 150` responde 400 `VALIDACION`.

### Fase 3 — Riego: manual, automático y ciclo completo · MVP

Corresponde al orden 3 y 4 del contrato. Es la parte más vistosa de la demo.

- [ ] `POST /dispositivos/{id}/riegos`:
  - Responde 202 con el comando creado en `PENDIENTE`.
  - Responde 409 `BOMBA_NO_DISPONIBLE` si el dispositivo no tiene bomba, y 409 `RIEGO_EN_CURSO` si ya hay un comando abierto (se atrapa la violación de `uq_comando_abierto`).
  - Antes de crear el comando expira los viejos con la consulta 6.
  - Guarda en `humedadSueloAntes` el último valor de humedad del suelo, o `null` si no hay.
- [ ] `GET /dispositivos/{id}/riegos?limite=20`.
- [ ] `POST /comandos/{comandoId}/confirmacion`:
  - Pasa el comando de `ENVIADO` a `EJECUTADO` o `FALLIDO`; si no está en `ENVIADO`, responde 409 `COMANDO_NO_ENVIADO`.
  - Un `FALLIDO` abre una alerta del sistema `CRITICA`.
- [ ] Paso 5 de `POST /lecturas`, la parte de riego: si la lectura es en tiempo real (`medidaEn` de hace menos de 2 min), aplica la regla de riego automático con la consulta 7.

**Terminada cuando:** se ven estos cuatro casos con el simulador en vivo:
1. Riego manual: el comando pasa por `PENDIENTE` → `ENVIADO` → `EJECUTADO`.
2. Con la humedad bajo el umbral se crea un riego `AUTOMATICO`.
3. Si el simulador no confirma, el comando termina en `EXPIRADO`.
4. Con `tieneBomba: false`, el riego responde 409.

### Fase 4 — Alertas · MVP

Corresponde al orden 4 del contrato.

- [ ] Paso 5 de `POST /lecturas`, la parte de alertas: con cada medición aceptada en tiempo real se evalúan las reglas activas de `regla_alerta`.
  - Si se cumple la condición y no hay alerta abierta, se abre una.
  - Si deja de cumplirse, la alerta abierta se cierra sola.
- [ ] `GET /dispositivos/{id}/alertas?estado=ACTIVA|TODAS`, de la más reciente a la más antigua.
- [ ] `POST /alertas/{id}/resolver`: responde 404 `ALERTA_NO_ENCONTRADA` si la alerta no existe.

**Terminada cuando:** el simulador envía temperatura alta → aparece una alerta activa → vuelve a valores normales → la alerta se cierra sola. El cierre manual también funciona.

### Fase 5 — Firebase en vivo

- [ ] Agregar `firebase-admin` y leer las credenciales de `FIREBASE_CREDENTIALS` y `FIREBASE_DB_URL`. Si no están configuradas, la API sigue funcionando y `/salud` dice `NO_CONFIGURADO`.
- [ ] Escribir los nodos de la tabla "Firebase Realtime Database" del contrato: `ultimaConexion`, `sensores/<TIPO>`, `riego`, `alertasActivas/<id>` y la configuración.
- [ ] Revisar Firebase en `/salud`.

**Terminada cuando:** con el simulador en vivo, la consola de Firebase cambia cada 10 s.

### Fase 6 — Reportes de IA

- [ ] Agregar Spring AI con Gemini (`GEMINI_API_KEY`).
- [ ] `POST /dispositivos/{id}/reportes`:
  - Usa las consultas 1, 2 y 3 y el prompt del contrato.
  - Responde 422 `DATOS_INSUFICIENTES` con menos de 10 mediciones, y 502 `IA_NO_DISPONIBLE` si falla el modelo (en ese caso no se guarda nada).
- [ ] `GET /dispositivos/{id}/reportes` y `GET /reportes/{id}`.

**Terminada cuando:** se generan reportes con 1 sensor y con 4 sensores, y el de 1 sensor menciona a los demás como no disponibles.

### Fase 7 — Despliegue y calidad

- [ ] Pruebas de integración con MockMvc y PostgreSQL para las reglas clave: descartes, 422, ciclo del comando, apertura y cierre de alertas.
- [ ] Desplegar la API en Render (`backend/Dockerfile`) con la base en Neon, y configurar `CORS_ORIGINS` con la URL del frontend.
- [ ] Repasar la lista "Pruebas de los modos con sensores parciales" del contrato.
- [ ] `GET /dispositivos/{id}/comandos/pendiente` (opcional en el contrato).

## Guion sugerido para la demo (fases 1 a 4)

1. `docker compose up -d`, arrancar la API y mostrar `GET /salud`.
2. Cargar 24 h de historial con el simulador y mostrar `GET /mediciones?agrupacion=HORA`.
3. Arrancar el simulador en vivo solo con `HUMEDAD_SUELO`: `GET /dispositivos/maceta-01` muestra **una** tarjeta. Esto demuestra que el sistema funciona con lo que esté armado.
4. Riego manual desde `docs/demo.http` y su paso por `PENDIENTE` → `ENVIADO` → `EJECUTADO`. Pedir un segundo riego mientras el primero sigue abierto da 409.
5. Bajar el umbral con `PATCH` y ver cómo se crea un riego automático.
6. Forzar una temperatura alta para que se abra una alerta, y luego dejar que se cierre sola.
7. Errores: lectura sin `X-Api-Key` (401) y lectura con humedad 150 (se descarta y la lectura responde 201).

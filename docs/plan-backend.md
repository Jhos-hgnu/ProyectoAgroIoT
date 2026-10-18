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
| `GET /salud` | Hecho (Firebase siempre `NO_CONFIGURADO` hasta la fase 5) |
| `POST /lecturas` | Hecho, salvo el paso 5 (alertas, riego automático y Firebase) |
| `GET /dispositivos/{id}` | Hecho |
| Resto de endpoints | Responden 501 `NO_IMPLEMENTADO` |
| Pruebas | Solo `ApiApplicationTests` (arranque del contexto) |

Las pruebas usan la base local, así que antes de `./mvnw test` hay que levantar Docker y cargar `backend/.env`, igual que para correr la API.

## Fases

Cada fase lista **qué se hace**, **dónde** y **cuándo está terminada**. "Terminada" significa que se puede mostrar con el simulador o con `docs/demo.http`, no solo que compila.

### Fase 1 — Simulador y datos de demo · MVP · hecha

Sin esto no hay demo, así que va primero. Detalle de uso en [`simulador/README.md`](../simulador/README.md).

- [x] `simulador/` con un script en Node 20, sin dependencias, porque `fetch` ya viene incluido. Toma la URL de la API y la `X-Api-Key` de variables de entorno.
  - Modo **en vivo**: una lectura cada 10 s con valores que varían de forma realista. Por ejemplo, la humedad del suelo baja poco a poco y sube después de un riego.
  - Modo **historial**: carga 24 h de lecturas con `medidaEn` para que las gráficas y el reporte tengan datos.
  - Opción `--sensores` para elegir qué sensores envía (`HUMEDAD_SUELO`, `TEMPERATURA,HUMEDAD_AIRE`, etc.) y así mostrar los modos con sensores parciales del contrato.
  - Si la respuesta de `/lecturas` trae `comando`, espera `duracionSeg` y lo confirma con `POST /comandos/{id}/confirmacion`. Con una opción, el simulador puede fallar o no confirmar, para mostrar los estados `FALLIDO` y `EXPIRADO`.
- [x] `docs/demo.http`: peticiones listas para ejecutar desde VS Code (REST Client) o IntelliJ, una por cada endpoint, incluidos los casos de error (401, 404, 409, 422).
- [x] README de `simulador/` con los comandos.

**Terminada cuando:** con la base vacía, `simulador historial` y luego `simulador vivo` llenan la base, y `GET /dispositivos/maceta-01` muestra los sensores enviados como `ACTIVO` y `conectado: true`.

### Fase 2 — Consultas del dashboard · MVP · hecha

Corresponde al orden 2 y 5 del contrato.

- [x] `GET /dispositivos/{id}/mediciones` (`MedicionService` y `SerieRepository`):
  - Sin agrupar usa la consulta 4 de `db/consultas.sql`; por hora usa la consulta 1, que da promedio, `min` y `max`.
  - Si faltan `desde` o `hasta`, toma las últimas 24 h. También acepta el filtro `tipos`.
  - Devuelve solo las series que tienen datos.
  - Límites, agregados también al contrato:
    - Un tipo desconocido en `tipos` responde 400, para detectar errores de escritura en el frontend.
    - El rango máximo es de 24 h sin agrupar y de 31 días por hora. Así ninguna respuesta pasa de ~1,3 MB.
- [x] `PATCH /dispositivos/{id}`:
  - Valida los rangos: umbral de 0 a 100 con hasta 2 decimales, duración de 1 a 60, espera ≥ 0.
  - Responde con el dispositivo completo.
  - Un cuerpo vacío o sin campos conocidos responde 400.
- [x] Pruebas de integración: `DispositivoControllerTest` (10 pruebas, con transacción que se revierte).
- `ApiException` no necesitó códigos nuevos en esta fase: los de riego y alertas se agregan en las fases 3 y 4.

**Terminada cuando:** con el historial de la fase 1, la consulta con `agrupacion=HORA` devuelve unas 24 filas por sensor, y un `PATCH` con `umbralRiego: 150` responde 400 `VALIDACION`.

### Fase 3 — Riego: manual, automático y ciclo completo · MVP · hecha

Corresponde al orden 3 y 4 del contrato. Es la parte más vistosa de la demo.

- [x] `POST /dispositivos/{id}/riegos`:
  - Responde 202 con el comando creado en `PENDIENTE`.
  - Responde 409 `BOMBA_NO_DISPONIBLE` si el dispositivo no tiene bomba, y 409 `RIEGO_EN_CURSO` si ya hay un comando abierto (se atrapa la violación de `uq_comando_abierto`).
  - Antes de crear el comando expira los viejos con la consulta 6.
  - Guarda en `humedadSueloAntes` el último valor de humedad del suelo, o `null` si no hay.
- [x] `GET /dispositivos/{id}/riegos?limite=20`.
- [x] `POST /comandos/{comandoId}/confirmacion`:
  - Pasa el comando de `ENVIADO` a `EJECUTADO` o `FALLIDO`; si no está en `ENVIADO`, responde 409 `COMANDO_NO_ENVIADO`.
  - Un `FALLIDO` abre una alerta del sistema `CRITICA`.
- [x] Paso 5 de `POST /lecturas`, la parte de riego: si la lectura es en tiempo real (`medidaEn` de hace menos de 2 min), aplica la regla de riego automático con la consulta 7.

**Terminada cuando:** se ven estos cuatro casos con el simulador en vivo:
1. Riego manual: el comando pasa por `PENDIENTE` → `ENVIADO` → `EJECUTADO`.
2. Con la humedad bajo el umbral se crea un riego `AUTOMATICO`.
3. Si el simulador no confirma, el comando termina en `EXPIRADO`.
4. Con `tieneBomba: false`, el riego responde 409.

Implementado en `RiegoService`, con 14 pruebas en `RiegoTest`. También se probó de punta a punta con el simulador: manual `EJECUTADO`, `FALLIDO` con alerta, automático con `--escenario seco` y `EXPIRADO` a los 2:00 con `--confirmacion nunca`. Las decisiones que el contrato no fijaba quedaron anotadas en él: el riego automático se entrega en la misma lectura, la expiración también se revisa al confirmar y `limite` va de 1 a 100.

### Fase 4 — Alertas · MVP · hecha

Corresponde al orden 4 del contrato.

- [x] Paso 5 de `POST /lecturas`, la parte de alertas: con cada medición aceptada en tiempo real se evalúan las reglas activas de `regla_alerta`.
  - Si se cumple la condición y no hay alerta abierta, se abre una.
  - Si deja de cumplirse, la alerta abierta se cierra sola.
- [x] `GET /dispositivos/{id}/alertas?estado=ACTIVA|TODAS`, de la más reciente a la más antigua.
- [x] `POST /alertas/{id}/resolver`: responde 404 `ALERTA_NO_ENCONTRADA` si la alerta no existe.

**Terminada cuando:** el simulador envía temperatura alta → aparece una alerta activa → vuelve a valores normales → la alerta se cierra sola. El cierre manual también funciona.

Implementado en `AlertaService`, con 9 pruebas en `AlertaTest`. Se probó con `--escenario calor`: la alerta se abrió a los 32,76 °C y se cerró sola al volver a lo normal. Lo que el contrato no fijaba quedó anotado en él:
- `limite` va de 1 a 200.
- Resolver una alerta ya resuelta no cambia nada.
- La comparación con el umbral es estricta.
- Si se resuelve a mano una alerta cuya condición sigue, la siguiente lectura abre otra.

**Con esto el MVP de la demo (fases 1 a 4) está completo.**

### Fase 5 — Firebase en vivo

- [x] Agregar `firebase-admin` (sin Firestore ni Storage) y leer las credenciales de `FIREBASE_CREDENTIALS` y `FIREBASE_DB_URL` (`FirebaseCliente`). Si no están configuradas, la API sigue funcionando y `/salud` dice `NO_CONFIGURADO`.
- [x] Escribir los nodos de la tabla "Firebase Realtime Database" del contrato: `ultimaConexion`, `sensores/<TIPO>`, `riego`, `alertasActivas/<id>` y la configuración (`EstadoVivoService`). Al arrancar, la API reescribe el nodo completo de cada dispositivo desde PostgreSQL.
- [x] Revisar Firebase en `/salud`: escribe `salud/revisadaEn` y espera hasta 5 s la confirmación.
- [x] Emulador local en `firebase/` (ver [`firebase/README.md`](../firebase/README.md)), para desarrollar sin la base real.
- [x] Pruebas: `SaludTest` (sin Firebase) y `SaludFirebaseErrorTest` (Firebase sin credenciales: la API arranca y `/salud` dice `DEGRADADO`).

**Terminada cuando:** con el simulador en vivo, la consola de Firebase cambia cada 10 s.

Validado con el emulador: el nodo cambia con cada lectura; las alertas aparecen y desaparecen de `alertasActivas` al abrirse, cerrarse solas o resolverse; `riego` pasa por `PENDIENTE`, `ENVIADO` y `EJECUTADO`/`FALLIDO`/`EXPIRADO`; el `PATCH` actualiza la configuración, y una lectura rechazada (422) no cambia nada. Falta repetirlo con la base real cuando esté creada.

### Fase 6 — Reportes de IA

- [x] Agregar Spring AI 2.0.1 con Gemini (`GEMINI_API_KEY` y `GEMINI_MODEL`, por defecto `gemini-3.8-flash`). Sin la key la API arranca igual y el reporte responde 502 (`GeminiConfig`).
- [x] `POST /dispositivos/{id}/reportes` (`ReporteService` y `ReporteDatosRepository`):
  - Usa las consultas 1, 2 y 3 y el prompt del contrato.
  - Responde 422 `DATOS_INSUFICIENTES` con menos de 10 mediciones, y 502 `IA_NO_DISPONIBLE` si falla el modelo (en ese caso no se guarda nada).
- [x] `GET /dispositivos/{id}/reportes` (`?limite=20`) y `GET /reportes/{id}`.
- [x] Pruebas: `ReporteTest` (11, con un modelo simulado: no gasta cuota) y `ReporteSinGeminiTest`.

**Terminada cuando:** se generan reportes con 1 sensor y con 4 sensores, y el de 1 sensor menciona a los demás como no disponibles.

Validado con el modelo simulado y con una key falsa (la petición llega a Gemini, que responde "API key not valid", y la API devuelve 502 en unos 3 s sin guardar nada). Con la key real (18 de octubre de 2026), `gemini-2.5-flash` ya no responde (404), así que el modelo por defecto pasó a `gemini-3.8-flash`, que generó un reporte real de 24 h en unos 25 s.

### Fase 7 — Despliegue y calidad

- [x] Pruebas de integración con MockMvc y PostgreSQL para las reglas clave: descartes, 422, ciclo del comando, apertura y cierre de alertas. Son 59; `SensoresParcialesTest` agrega los descartes y los modos parciales.
- [x] Imagen Docker ajustada al plan gratuito de Render (512 MB, 0.1 CPU): arranque de 122 s a 44 s y unos 206 MB bajo carga.
- [x] Guía de despliegue: [`despliegue.md`](despliegue.md).
- [ ] Desplegar la API en Render (`backend/Dockerfile`) con la base en Neon, y configurar `CORS_ORIGINS` con la URL del frontend. Falta crear las cuentas.
- [x] Repasar la lista "Pruebas de los modos con sensores parciales" del contrato: la parte de la API está cubierta; faltan las casillas del dashboard, de Gemini y de Render.
- [x] `GET /dispositivos/{id}/comandos/pendiente` (opcional en el contrato).

## Guion sugerido para la demo (fases 1 a 4)

Validado de principio a fin sobre una base vacía (ver [`validacion-mvp.md`](validacion-mvp.md)).

1. `docker compose up -d`, arrancar la API y ejecutar `node simulador.mjs salud`.
2. `node simulador.mjs historial` (24 h en unos 8 s) y mostrar `GET /mediciones?agrupacion=HORA`: una serie por sensor, con promedio, mínimo y máximo por hora.
3. `node simulador.mjs vivo --sensores suelo` y mostrar `GET /dispositivos/maceta-01`:
   - La humedad del suelo aparece `ACTIVO`.
   - Los otros tres sensores (tienen historial, pero ya no envían) aparecen `SIN_DATOS`: el frontend los pinta en gris y la API no inventa valores.
   - Esto demuestra que el sistema funciona con lo que esté armado.
4. `POST /riegos` desde `docs/demo.http`; un segundo `POST` da 409 `RIEGO_EN_CURSO`. El simulador recoge el comando y lo confirma: `GET /riegos` muestra `EJECUTADO`.
5. Riego automático:
   - Hacer `PATCH { "esperaRiegoMin": 0 }`, porque tras el riego manual la API espera 10 min.
   - Ejecutar `node simulador.mjs vivo --sensores suelo --escenario seco`.
   - En unos 40 s el suelo baja de 35 % y llega un riego `AUTOMATICO`.
   - Al terminar, volver a poner `esperaRiegoMin` en 10.
6. `node simulador.mjs vivo --sensores temp --escenario calor`: en aproximadamente 1 min se abre "Temperatura alta" en `GET /alertas`. Al volver a `--escenario normal`, la alerta se cierra sola.
7. Errores: lectura sin `X-Api-Key` (401) y lectura con humedad 150 (se descarta y la lectura responde 201).

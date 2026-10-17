# AgroIoT — Validación del MVP del backend

Fecha: 16 de octubre de 2026 · Rama: `backend/mvp-api` · Alcance: fases 1 a 4 de [`plan-backend.md`](plan-backend.md).

**Veredicto: presentable.** La API cubre todo lo que necesita el dashboard: lecturas, gráficas, configuración, riego y alertas. Funciona sin electrónica gracias al simulador, que hace de ESP32.

## Resultados

| Validación | Cómo se hizo | Resultado |
| --- | --- | --- |
| Pruebas de integración | `./mvnw clean verify` contra PostgreSQL real | ✅ 34 de 34 |
| Empaquetado e imagen Docker | `docker build` con `backend/Dockerfile`, la imagen que usará Render | ✅ Compila y arranca |
| Guion de la demo desde cero | Base vacía con solo `db/schema.sql` + API en Docker + simulador, los 7 pasos | ✅ 7 de 7 |
| `docs/demo.http` | Las 27 peticiones, comparando cada código HTTP con el anotado | ✅ 14 de 14 con código anotado ¹ |
| CORS | Preflight desde `localhost:5173` y desde otro origen | ✅ GET, POST y PATCH permitidos; otro origen, 403 |
| Seguridad del repositorio | Búsqueda de claves y `.env` versionados | ✅ Ninguno |
| Frontend | `npm ci`, `npm run build`, `npm run lint` | ✅ Compila, sin errores de lint, 0 vulnerabilidades |

¹ La única diferencia es `POST /reportes`, que responde 501 porque es de la fase 6, como avisa el archivo.

### Cobertura de las pruebas de integración

| Clase | Pruebas | Qué cubre |
| --- | --- | --- |
| `DispositivoControllerTest` | 10 | Mediciones sin agrupar y por hora, filtros, límites de rango, `PATCH` y sus validaciones |
| `RiegoTest` | 14 | Riego manual, 409, ciclo `PENDIENTE` → `ENVIADO` → `EJECUTADO` / `FALLIDO` / `EXPIRADO`, riego automático, espera entre riegos |
| `AlertaTest` | 9 | Apertura y cierre automático, sin duplicados, sensores ausentes, historial, resolución manual |
| `ApiApplicationTests` | 1 | Arranque de la aplicación |

Cada prueba corre en una transacción que se revierte, así que no deja datos en la base.

## Estado de los endpoints

| Listos (13) | Pendientes (4, responden 501) |
| --- | --- |
| `GET /salud`, `POST /lecturas`, `POST /comandos/{id}/confirmacion` | `POST /dispositivos/{id}/reportes` (fase 6) |
| `GET` y `PATCH /dispositivos/{id}`, `GET /dispositivos/{id}/mediciones` | `GET /dispositivos/{id}/reportes` (fase 6) |
| `POST` y `GET /dispositivos/{id}/riegos` | `GET /reportes/{id}` (fase 6) |
| `GET /dispositivos/{id}/alertas`, `POST /alertas/{id}/resolver` | `GET /dispositivos/{id}/comandos/pendiente` (opcional) |

## Detalles conocidos (aceptables para un MVP)

1. **El dashboard todavía usa datos fijos** (`potsData`) y no llama a la API. La demo es de la API. Conectar el dashboard es el siguiente paso con más impacto visual: el cliente tipado `src/api/cliente.ts` ya existe.
2. **Firebase no está integrado** (fase 5), así que `/salud` responde `firebase: NO_CONFIGURADO`. El dashboard tendría que consultar la API cada pocos segundos para ver datos en vivo.
3. **Memoria:** la API usa unos 445 MB sin límite de memoria configurado, y el plan gratuito de Render tiene 512 MB. Hay que vigilarlo al desplegar (fase 7).
4. **Para repetir el riego automático en la demo** hay que bajar `esperaRiegoMin` a 0, porque por diseño la API espera 10 min entre riegos.
5. **Una alerta resuelta a mano vuelve a abrirse** en la siguiente lectura si la condición sigue cumpliéndose. Así lo define el contrato.
6. **Las pruebas necesitan la base local** (Docker y `backend/.env`); aún no hay integración continua.

## Corregido durante la validación

- **Paso 3 del guion:** prometía "una tarjeta", pero tras cargar el historial la API devuelve los 4 sensores (3 como `SIN_DATOS`), que es lo correcto según el contrato. Se reescribió el guion con los comandos exactos.
- **Frontend que no compilaba en una copia vieja:** `react-bootstrap` llegó con el merge del dashboard. Después de hacer `git pull` hay que ejecutar `npm ci` en `frontend/`.

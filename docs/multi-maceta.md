# Alta de macetas reales (rama `feature/multi-maceta`)

Reemplaza el botón "Agregar maceta" que creaba datos ficticios en el navegador: ahora registra la
maceta en la API y la base de datos. **No está integrada a `develop` ni `main`**; el demo publicado
sigue con `maceta-01` fija.

## Qué cambia

| Capa | Cambio |
|---|---|
| BD | `dispositivo` gana `cultivo`, `zona` y `sector` (opcionales). `db/schema.sql` ya las incluye; para una base existente, `db/migrations/001_dispositivo_cultivo_zona_sector.sql` (idempotente). |
| API | `GET /api/dispositivos` (lista) y `POST /api/dispositivos` (alta). El `id` es el siguiente correlativo (`maceta-02`, `maceta-03`…). `DispositivoResponse` suma `cultivo`, `zona`, `sector`. |
| Frontend | La lista de macetas sale de la API (`useDispositivos`); `useMaceta` sigue a la maceta seleccionada, ya no a `maceta-01` fija. Se eliminan las macetas 02 y 03 de ejemplo. |

Una maceta nueva nace **sin sensores**: la pantalla muestra "sin datos" hasta que el ESP32 (o el
simulador) envía su primera lectura con ese `dispositivoId`.

## Integrarla (si se decide)

1. Aplicar la migración a la base (Neon en producción) **antes** de desplegar la API, porque
   `ddl-auto=validate` falla si faltan las columnas:
   `psql "$DB_URL" -f db/migrations/001_dispositivo_cultivo_zona_sector.sql`
2. Desplegar la API y luego el frontend.
3. Registrar la maceta desde el dashboard y arrancar el simulador con su id:
   `DISPOSITIVO_ID=maceta-02 node simulador.mjs vivo`

## Probarla sin tocar la base local ni la publicada

```bash
docker run -d --name agroiot-pg-multimaceta -e POSTGRES_DB=agroiot -e POSTGRES_USER=agroiot \
  -e POSTGRES_PASSWORD=agroiot -p 5434:5432 -v "$PWD/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro" postgres:16
# API en 8081 y frontend en 5174, para no chocar con el demo local (8080 / 5173)
DB_URL=jdbc:postgresql://localhost:5434/agroiot DB_USER=agroiot DB_PASSWORD=agroiot DEVICE_API_KEY=clave \
  PORT=8081 CORS_ORIGINS=http://localhost:5174 ./mvnw spring-boot:run          # en backend/
VITE_API_URL=http://localhost:8081/api npx vite --port 5174                      # en frontend/
```

## Pendiente / limitaciones conocidas

- Las pantallas de Alertas, Análisis y Reportes consultan la API solo de la maceta seleccionada.
- No hay editar ni borrar macetas (solo alta y lectura).
- Batería, nivel del tanque y otros datos que el hardware aún no envía se muestran vacíos.

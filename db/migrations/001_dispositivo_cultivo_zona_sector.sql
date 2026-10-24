-- Migración para bases YA creadas con el schema anterior (no hace falta en una base nueva:
-- db/schema.sql ya incluye estas columnas). Es idempotente: se puede ejecutar más de una vez.
--
-- Agrega los datos que el formulario "Agregar maceta" registra. Son opcionales, así que
-- 'maceta-01' y cualquier dispositivo existente siguen funcionando sin cambios.
--
-- Ejemplo (Docker local):
--   docker exec -i agroiot-postgres psql -U agroiot -d agroiot < db/migrations/001_dispositivo_cultivo_zona_sector.sql
ALTER TABLE dispositivo
    ADD COLUMN IF NOT EXISTS cultivo VARCHAR(80),
    ADD COLUMN IF NOT EXISTS zona    VARCHAR(40),
    ADD COLUMN IF NOT EXISTS sector  VARCHAR(40);

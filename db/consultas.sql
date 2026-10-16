-- =====================================================================
-- AgroIoT - Consultas clave para la API
-- Los parámetros con dos puntos (:dispositivoId, :horas...) se pasan
-- desde Spring (@Query nativa con @Param o JdbcTemplate).
-- =====================================================================

-- 1) Resumen por hora y sensor (base del reporte de IA y de la gráfica de 24 h).
--    Solo devuelve los sensores que tienen datos: si falta uno, no aparece.
--    La hora se agrupa en hora de Guatemala para que el reporte la lea bien.
SELECT tipo_sensor,
       date_trunc('hour', medida_en AT TIME ZONE 'America/Guatemala') AS hora_local,
       ROUND(AVG(valor), 2) AS promedio,
       MIN(valor)           AS minimo,
       MAX(valor)           AS maximo,
       COUNT(*)             AS muestras
FROM v_medicion
WHERE dispositivo_id = :dispositivoId
  AND medida_en >= now() - make_interval(hours => :horas)
GROUP BY tipo_sensor, hora_local
ORDER BY tipo_sensor, hora_local;

-- 2) Totales de la ventana por sensor (para el encabezado del reporte).
SELECT tipo_sensor,
       ROUND(AVG(valor), 2) AS promedio,
       MIN(valor)           AS minimo,
       MAX(valor)           AS maximo,
       COUNT(*)             AS muestras
FROM v_medicion
WHERE dispositivo_id = :dispositivoId
  AND medida_en >= now() - make_interval(hours => :horas)
GROUP BY tipo_sensor;

-- 3) Riegos de la ventana por origen y estado (para el reporte de IA).
SELECT origen, estado, COUNT(*) AS total
FROM comando_riego
WHERE dispositivo_id = :dispositivoId
  AND creado_en >= now() - make_interval(hours => :horas)
GROUP BY origen, estado;

-- 4) Serie sin agrupar de un rango (gráfica de la última hora).
SELECT tipo_sensor, medida_en, valor
FROM v_medicion
WHERE dispositivo_id = :dispositivoId
  AND medida_en BETWEEN :desde AND :hasta
ORDER BY tipo_sensor, medida_en;

-- 5) Upsert de sensores detectados (se ejecuta por cada medición aceptada).
INSERT INTO dispositivo_sensor (dispositivo_id, tipo_sensor, primera_lectura, ultima_lectura, ultimo_valor)
VALUES (:dispositivoId, :tipoSensor, :medidaEn, :medidaEn, :valor)
ON CONFLICT (dispositivo_id, tipo_sensor)
DO UPDATE SET ultima_lectura = GREATEST(dispositivo_sensor.ultima_lectura, EXCLUDED.ultima_lectura),
              ultimo_valor   = CASE WHEN EXCLUDED.ultima_lectura >= dispositivo_sensor.ultima_lectura
                                    THEN EXCLUDED.ultimo_valor
                                    ELSE dispositivo_sensor.ultimo_valor END;

-- 6) Expirar comandos abiertos de más de 2 minutos (se ejecuta antes de crear uno nuevo).
UPDATE comando_riego
SET estado = 'EXPIRADO', finalizado_en = now()
WHERE dispositivo_id = :dispositivoId
  AND estado IN ('PENDIENTE', 'ENVIADO')
  AND creado_en < now() - INTERVAL '2 minutes';

-- 7) ¿Se puede regar automáticamente? (último riego terminado hace más de espera_riego_min)
SELECT NOT EXISTS (
    SELECT 1
    FROM comando_riego c
    JOIN dispositivo d ON d.id = c.dispositivo_id
    WHERE c.dispositivo_id = :dispositivoId
      AND (c.estado IN ('PENDIENTE', 'ENVIADO')
           OR c.creado_en > now() - make_interval(mins => d.espera_riego_min))
) AS puede_regar;

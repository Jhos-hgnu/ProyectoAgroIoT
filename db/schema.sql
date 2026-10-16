-- =====================================================================
-- AgroIoT - Esquema PostgreSQL
-- Ejecutar completo en el SQL Editor de Neon (o en un Postgres local).
-- ATENCIÓN: el bloque DROP borra las tablas y sus datos. Úsenlo solo
-- para reiniciar la base durante el desarrollo.
-- =====================================================================

DROP VIEW  IF EXISTS v_medicion;
DROP TABLE IF EXISTS reporte_ia, alerta, regla_alerta, comando_riego,
                     medicion, lectura, dispositivo_sensor, dispositivo,
                     tipo_sensor CASCADE;

-- ---------------------------------------------------------------------
-- Catálogo de tipos de sensor. Agregar un sensor nuevo = insertar una
-- fila aquí; no cambia ninguna otra tabla.
-- ---------------------------------------------------------------------
CREATE TABLE tipo_sensor (
    codigo      VARCHAR(30)  PRIMARY KEY,          -- HUMEDAD_SUELO, TEMPERATURA...
    nombre      VARCHAR(60)  NOT NULL,
    unidad      VARCHAR(10)  NOT NULL,             -- '%', '°C'
    valor_min   NUMERIC(8,2) NOT NULL,             -- rango físico válido
    valor_max   NUMERIC(8,2) NOT NULL,
    componente  VARCHAR(60),                        -- sensor físico que lo mide
    CHECK (valor_min < valor_max)
);

-- ---------------------------------------------------------------------
-- Dispositivo (la maceta). Guarda la configuración de riego.
-- ---------------------------------------------------------------------
CREATE TABLE dispositivo (
    id                  VARCHAR(40)  PRIMARY KEY,  -- 'maceta-01'
    nombre              VARCHAR(80)  NOT NULL,
    ubicacion           VARCHAR(120),
    tiene_bomba         BOOLEAN      NOT NULL DEFAULT FALSE,
    riego_automatico    BOOLEAN      NOT NULL DEFAULT TRUE,
    umbral_riego        NUMERIC(5,2) NOT NULL DEFAULT 35
                        CHECK (umbral_riego BETWEEN 0 AND 100),   -- % humedad de suelo
    duracion_riego_seg  INTEGER      NOT NULL DEFAULT 5
                        CHECK (duracion_riego_seg BETWEEN 1 AND 60),
    espera_riego_min    INTEGER      NOT NULL DEFAULT 10
                        CHECK (espera_riego_min >= 0),            -- mínimo entre riegos automáticos
    ultima_conexion     TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Sensores que cada dispositivo ha enviado alguna vez. La API la llena
-- sola (upsert) al recibir lecturas: nadie la mantiene a mano.
-- ---------------------------------------------------------------------
CREATE TABLE dispositivo_sensor (
    dispositivo_id   VARCHAR(40)  NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    tipo_sensor      VARCHAR(30)  NOT NULL REFERENCES tipo_sensor(codigo),
    primera_lectura  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ultima_lectura   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ultimo_valor     NUMERIC(8,2),
    PRIMARY KEY (dispositivo_id, tipo_sensor)
);

-- ---------------------------------------------------------------------
-- Lectura = un envío del ESP32 (o del simulador).
-- medida_en: cuándo se midió (viene en el JSON o se usa la hora del servidor).
-- recibida_en: cuándo llegó a la API.
-- ---------------------------------------------------------------------
CREATE TABLE lectura (
    id              BIGSERIAL    PRIMARY KEY,
    dispositivo_id  VARCHAR(40)  NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    medida_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    recibida_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_lectura_dispositivo_fecha ON lectura (dispositivo_id, medida_en DESC);

-- ---------------------------------------------------------------------
-- Medición = un valor de un sensor dentro de una lectura.
-- Una lectura tiene de 1 a N mediciones, según los sensores armados.
-- ---------------------------------------------------------------------
CREATE TABLE medicion (
    id           BIGSERIAL    PRIMARY KEY,
    lectura_id   BIGINT       NOT NULL REFERENCES lectura(id) ON DELETE CASCADE,
    tipo_sensor  VARCHAR(30)  NOT NULL REFERENCES tipo_sensor(codigo),
    valor        NUMERIC(8,2) NOT NULL,
    UNIQUE (lectura_id, tipo_sensor)                -- un valor por sensor por lectura
);
CREATE INDEX idx_medicion_tipo ON medicion (tipo_sensor);

-- ---------------------------------------------------------------------
-- Comandos de riego (manuales y automáticos). También es el historial
-- de riegos.
-- ---------------------------------------------------------------------
CREATE TABLE comando_riego (
    id                   BIGSERIAL    PRIMARY KEY,
    dispositivo_id       VARCHAR(40)  NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    origen               VARCHAR(12)  NOT NULL CHECK (origen IN ('MANUAL', 'AUTOMATICO')),
    duracion_seg         INTEGER      NOT NULL CHECK (duracion_seg BETWEEN 1 AND 60),
    estado               VARCHAR(12)  NOT NULL DEFAULT 'PENDIENTE'
                         CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'EJECUTADO', 'FALLIDO', 'EXPIRADO')),
    humedad_suelo_antes  NUMERIC(5,2),             -- null si no hay sensor de suelo
    detalle              VARCHAR(200),
    creado_en            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    enviado_en           TIMESTAMPTZ,
    finalizado_en        TIMESTAMPTZ
);
CREATE INDEX idx_comando_dispositivo_fecha ON comando_riego (dispositivo_id, creado_en DESC);
-- La base de datos impide dos comandos abiertos a la vez para el mismo dispositivo.
CREATE UNIQUE INDEX uq_comando_abierto ON comando_riego (dispositivo_id)
    WHERE estado IN ('PENDIENTE', 'ENVIADO');

-- ---------------------------------------------------------------------
-- Reglas de alerta configurables (umbral por tipo de sensor).
-- ---------------------------------------------------------------------
CREATE TABLE regla_alerta (
    id           SERIAL       PRIMARY KEY,
    tipo_sensor  VARCHAR(30)  NOT NULL REFERENCES tipo_sensor(codigo),
    operador     VARCHAR(2)   NOT NULL CHECK (operador IN ('<', '>')),
    umbral       NUMERIC(8,2) NOT NULL,
    severidad    VARCHAR(12)  NOT NULL CHECK (severidad IN ('INFO', 'ADVERTENCIA', 'CRITICA')),
    mensaje      VARCHAR(160) NOT NULL,
    activa       BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- Alertas generadas. resuelta_en null = alerta activa.
-- ---------------------------------------------------------------------
CREATE TABLE alerta (
    id              BIGSERIAL    PRIMARY KEY,
    dispositivo_id  VARCHAR(40)  NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    regla_id        INTEGER      REFERENCES regla_alerta(id),   -- null = alerta del sistema (p. ej. riego fallido)
    tipo_sensor     VARCHAR(30)  REFERENCES tipo_sensor(codigo),
    valor           NUMERIC(8,2),
    severidad       VARCHAR(12)  NOT NULL CHECK (severidad IN ('INFO', 'ADVERTENCIA', 'CRITICA')),
    mensaje         VARCHAR(200) NOT NULL,
    creada_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resuelta_en     TIMESTAMPTZ
);
CREATE INDEX idx_alerta_dispositivo_fecha ON alerta (dispositivo_id, creada_en DESC);
-- Una sola alerta abierta por regla y dispositivo (no se duplica cada 10 s).
CREATE UNIQUE INDEX uq_alerta_abierta ON alerta (dispositivo_id, regla_id)
    WHERE resuelta_en IS NULL;

-- ---------------------------------------------------------------------
-- Reportes generados por la IA.
-- ---------------------------------------------------------------------
CREATE TABLE reporte_ia (
    id               BIGSERIAL    PRIMARY KEY,
    dispositivo_id   VARCHAR(40)  NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    desde            TIMESTAMPTZ  NOT NULL,
    hasta            TIMESTAMPTZ  NOT NULL,
    sensores         VARCHAR(200) NOT NULL,        -- tipos con datos, separados por coma
    resumen_entrada  TEXT         NOT NULL,        -- JSON que se envió al modelo
    contenido        TEXT         NOT NULL,        -- respuesta del modelo (Markdown)
    modelo           VARCHAR(60)  NOT NULL,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (desde < hasta)
);
CREATE INDEX idx_reporte_dispositivo_fecha ON reporte_ia (dispositivo_id, creado_en DESC);

-- ---------------------------------------------------------------------
-- Vista de apoyo: cada medición con su dispositivo y fecha (evita
-- escribir el JOIN en cada consulta).
-- ---------------------------------------------------------------------
CREATE VIEW v_medicion AS
SELECT m.id,
       l.dispositivo_id,
       m.tipo_sensor,
       m.valor,
       l.medida_en,
       l.id AS lectura_id
FROM medicion m
JOIN lectura  l ON l.id = m.lectura_id;

-- =====================================================================
-- Datos iniciales
-- =====================================================================
INSERT INTO tipo_sensor (codigo, nombre, unidad, valor_min, valor_max, componente) VALUES
    ('HUMEDAD_SUELO', 'Humedad del suelo',         '%',  0,   100, 'Sensor capacitivo v1.2'),
    ('TEMPERATURA',   'Temperatura del aire',      '°C', -10, 60,  'DHT22'),
    ('HUMEDAD_AIRE',  'Humedad relativa del aire', '%',  0,   100, 'DHT22'),
    ('LUZ',           'Intensidad de luz',         '%',  0,   100, 'Módulo LDR');

INSERT INTO dispositivo (id, nombre, ubicacion, tiene_bomba) VALUES
    ('maceta-01', 'Maceta 01', 'Laboratorio', TRUE);

INSERT INTO regla_alerta (tipo_sensor, operador, umbral, severidad, mensaje) VALUES
    ('HUMEDAD_SUELO', '<', 25, 'ADVERTENCIA', 'Suelo seco: la planta necesita agua'),
    ('HUMEDAD_SUELO', '>', 90, 'INFO',        'Suelo saturado: posible exceso de riego'),
    ('TEMPERATURA',   '>', 32, 'ADVERTENCIA', 'Temperatura alta'),
    ('TEMPERATURA',   '<', 10, 'ADVERTENCIA', 'Temperatura baja'),
    ('HUMEDAD_AIRE',  '>', 85, 'ADVERTENCIA', 'Humedad del aire alta: riesgo de hongos');

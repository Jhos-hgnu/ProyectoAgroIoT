package com.agroiot.api.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración propia de la API (prefijo "agroiot" en application.properties).
 *
 * @param deviceApiKey clave que el ESP32 envía en X-Api-Key (DEVICE_API_KEY)
 * @param corsOrigins orígenes permitidos para el frontend (CORS_ORIGINS, separados por coma)
 */
@ConfigurationProperties(prefix = "agroiot")
public record AppProperties(String deviceApiKey, List<String> corsOrigins) {
}

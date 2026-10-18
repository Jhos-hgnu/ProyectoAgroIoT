package com.agroiot.api.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración propia de la API (prefijo "agroiot" en application.properties).
 *
 * @param deviceApiKey clave que el ESP32 envía en X-Api-Key (DEVICE_API_KEY)
 * @param corsOrigins orígenes permitidos para el frontend (CORS_ORIGINS, separados por coma)
 * @param firebase conexión a Firebase Realtime Database; vacía = Firebase NO_CONFIGURADO
 */
@ConfigurationProperties(prefix = "agroiot")
public record AppProperties(String deviceApiKey, List<String> corsOrigins, Firebase firebase) {

	/**
	 * @param dbUrl URL de la base (FIREBASE_DB_URL). Con el emulador: http://127.0.0.1:9000?ns=demo-agroiot-default-rtdb
	 * @param credentials llave de service account (FIREBASE_CREDENTIALS): el JSON completo o la ruta al archivo.
	 *        Con el emulador no hace falta.
	 */
	public record Firebase(String dbUrl, String credentials) {
	}

}

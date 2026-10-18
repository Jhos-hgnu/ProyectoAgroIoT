package com.agroiot.api.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración propia de la API (prefijo "agroiot" en application.properties).
 *
 * @param deviceApiKey clave que el ESP32 envía en X-Api-Key (DEVICE_API_KEY)
 * @param corsOrigins orígenes permitidos para el frontend (CORS_ORIGINS, separados por coma)
 * @param firebase conexión a Firebase Realtime Database; vacía = Firebase NO_CONFIGURADO
 * @param gemini modelo de los reportes de IA; sin api-key, los reportes responden IA_NO_DISPONIBLE
 */
@ConfigurationProperties(prefix = "agroiot")
public record AppProperties(String deviceApiKey, List<String> corsOrigins, Firebase firebase, Gemini gemini) {

	/**
	 * @param apiKey key de Google AI Studio (GEMINI_API_KEY)
	 * @param model nombre del modelo (GEMINI_MODEL); se guarda en cada reporte
	 */
	public record Gemini(String apiKey, String model) {
	}

	/**
	 * @param dbUrl URL de la base (FIREBASE_DB_URL). Con el emulador: http://127.0.0.1:9000?ns=demo-agroiot-default-rtdb
	 * @param credentials llave de service account (FIREBASE_CREDENTIALS): el JSON completo o la ruta al archivo.
	 *        Con el emulador no hace falta.
	 */
	public record Firebase(String dbUrl, String credentials) {
	}

}

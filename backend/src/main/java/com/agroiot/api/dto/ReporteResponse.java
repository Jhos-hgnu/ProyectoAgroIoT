package com.agroiot.api.dto;

import java.time.Instant;
import java.util.List;

/** Reporte completo: respuesta de POST /dispositivos/{id}/reportes y de GET /reportes/{id}. */
public record ReporteResponse(
		Long id,
		Instant desde,
		Instant hasta,
		List<String> sensores,
		List<String> sensoresSinDatos,
		String contenido,
		String modelo,
		Instant creadoEn) {
}

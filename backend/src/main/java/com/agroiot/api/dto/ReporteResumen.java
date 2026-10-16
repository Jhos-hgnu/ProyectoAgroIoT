package com.agroiot.api.dto;

import java.time.Instant;
import java.util.List;

/** Elemento de GET /dispositivos/{id}/reportes: el reporte sin contenido. */
public record ReporteResumen(
		Long id,
		Instant desde,
		Instant hasta,
		List<String> sensores,
		List<String> sensoresSinDatos,
		String modelo,
		Instant creadoEn) {
}

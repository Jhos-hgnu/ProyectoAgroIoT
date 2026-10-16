package com.agroiot.api.dto;

import java.time.Instant;
import java.util.List;

/** GET /dispositivos/{id}/mediciones. Solo vienen las series con datos. */
public record MedicionesResponse(
		String dispositivoId,
		Instant desde,
		Instant hasta,
		Agrupacion agrupacion,
		List<Serie> series) {
}

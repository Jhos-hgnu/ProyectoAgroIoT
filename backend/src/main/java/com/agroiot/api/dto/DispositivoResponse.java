package com.agroiot.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** GET /dispositivos/{id} (y respuesta de PATCH). sensores = solo los que han enviado datos. */
public record DispositivoResponse(
		String id,
		String nombre,
		String ubicacion,
		String cultivo,
		String zona,
		String sector,
		boolean tieneBomba,
		boolean riegoAutomatico,
		boolean riegoAutomaticoDisponible,
		BigDecimal umbralRiego,
		int duracionRiegoSeg,
		int esperaRiegoMin,
		Instant ultimaConexion,
		boolean conectado,
		List<SensorDetectado> sensores) {
}

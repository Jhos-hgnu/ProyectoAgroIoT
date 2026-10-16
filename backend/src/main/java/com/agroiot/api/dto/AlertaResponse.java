package com.agroiot.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.agroiot.api.entity.Severidad;

/** Alerta. tipoSensor y valor son null en las alertas del sistema; resueltaEn null = activa. */
public record AlertaResponse(
		Long id,
		String tipoSensor,
		Severidad severidad,
		String mensaje,
		BigDecimal valor,
		Instant creadaEn,
		Instant resueltaEn) {
}

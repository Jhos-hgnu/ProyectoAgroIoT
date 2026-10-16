package com.agroiot.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.agroiot.api.entity.EstadoComando;
import com.agroiot.api.entity.OrigenComando;

/** Respuesta de POST /dispositivos/{id}/riegos y elementos de GET /dispositivos/{id}/riegos. */
public record RiegoResponse(
		Long id,
		OrigenComando origen,
		EstadoComando estado,
		Integer duracionSeg,
		BigDecimal humedadSueloAntes,
		Instant creadoEn,
		Instant finalizadoEn) {
}

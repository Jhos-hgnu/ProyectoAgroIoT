package com.agroiot.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SensorDetectado(
		String tipo,
		String nombre,
		String unidad,
		BigDecimal ultimoValor,
		Instant ultimaLectura,
		EstadoSensor estado) {
}

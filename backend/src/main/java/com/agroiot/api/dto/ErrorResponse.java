package com.agroiot.api.dto;

import java.time.Instant;

/** Formato único de error del contrato: { codigo, mensaje, timestamp }. */
public record ErrorResponse(String codigo, String mensaje, Instant timestamp) {
}

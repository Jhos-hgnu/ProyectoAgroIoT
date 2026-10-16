package com.agroiot.api.dto;

import java.util.List;

/** Respuesta 201 de POST /lecturas. comando es null si no hay riego pendiente. */
public record LecturaResponse(
		Long lecturaId,
		List<String> aceptadas,
		List<MedicionDescartada> descartadas,
		ComandoEntregado comando) {
}

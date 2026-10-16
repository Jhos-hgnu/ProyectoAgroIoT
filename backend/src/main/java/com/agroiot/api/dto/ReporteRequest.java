package com.agroiot.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** POST /dispositivos/{id}/reportes. horas entre 1 y 72 (por defecto 24). */
public record ReporteRequest(@Min(1) @Max(72) Integer horas) {

	public static final int HORAS_POR_DEFECTO = 24;

}

package com.agroiot.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * POST /dispositivos. El id y el nombre los genera la API (maceta-02, "Maceta 02 — Lechuga").
 * tieneBomba por defecto es true: las macetas del invernadero llevan bomba.
 */
public record DispositivoCrearRequest(
		@NotBlank @Size(max = 50) String cultivo,
		@Size(max = 40) String zona,
		@Size(max = 40) String sector,
		Boolean tieneBomba) {
}

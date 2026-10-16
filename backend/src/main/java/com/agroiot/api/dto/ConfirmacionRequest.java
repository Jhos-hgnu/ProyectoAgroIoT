package com.agroiot.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** POST /comandos/{comandoId}/confirmacion. estado = EJECUTADO | FALLIDO. */
public record ConfirmacionRequest(
		@NotBlank String dispositivoId,
		@NotNull @Pattern(regexp = "EJECUTADO|FALLIDO") String estado,
		@Size(max = 200) String detalle) {
}

package com.agroiot.api.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/** POST /lecturas. medidaEn es opcional: si falta se usa la hora del servidor. */
public record LecturaRequest(
		@NotBlank String dispositivoId,
		Instant medidaEn,
		@NotEmpty List<@NotNull @Valid MedicionRequest> mediciones) {
}

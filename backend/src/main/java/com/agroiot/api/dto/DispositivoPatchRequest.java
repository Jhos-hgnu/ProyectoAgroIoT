package com.agroiot.api.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** PATCH /dispositivos/{id}. Solo se envían los campos a cambiar (los null no se tocan). */
public record DispositivoPatchRequest(
		Boolean riegoAutomatico,
		@DecimalMin("0") @DecimalMax("100") BigDecimal umbralRiego,
		@Min(1) @Max(60) Integer duracionRiegoSeg,
		@Min(0) Integer esperaRiegoMin,
		Boolean tieneBomba) {
}

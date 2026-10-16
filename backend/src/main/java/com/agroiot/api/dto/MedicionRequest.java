package com.agroiot.api.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicionRequest(@NotBlank String tipo, @NotNull BigDecimal valor) {
}

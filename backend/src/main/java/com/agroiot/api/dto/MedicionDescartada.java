package com.agroiot.api.dto;

import java.math.BigDecimal;

public record MedicionDescartada(String tipo, BigDecimal valor, MotivoDescarte motivo) {
}

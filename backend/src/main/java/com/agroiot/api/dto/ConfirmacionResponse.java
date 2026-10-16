package com.agroiot.api.dto;

import com.agroiot.api.entity.EstadoComando;

public record ConfirmacionResponse(Long id, EstadoComando estado) {
}

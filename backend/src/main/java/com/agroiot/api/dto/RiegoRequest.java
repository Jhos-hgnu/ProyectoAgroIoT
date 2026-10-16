package com.agroiot.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** POST /dispositivos/{id}/riegos. Cuerpo opcional; sin duracionSeg se usa la configurada. */
public record RiegoRequest(@Min(1) @Max(60) Integer duracionSeg) {
}

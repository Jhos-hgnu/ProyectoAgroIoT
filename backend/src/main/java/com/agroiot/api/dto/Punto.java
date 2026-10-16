package com.agroiot.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Punto de una serie. Con agrupacion=HORA, valor es el promedio y vienen min y max. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Punto(Instant t, BigDecimal valor, BigDecimal min, BigDecimal max) {
}

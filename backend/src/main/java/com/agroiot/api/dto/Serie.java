package com.agroiot.api.dto;

import java.util.List;

public record Serie(String tipo, String unidad, List<Punto> puntos) {
}

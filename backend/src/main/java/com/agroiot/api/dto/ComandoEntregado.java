package com.agroiot.api.dto;

/** Comando que viaja al ESP32 (en POST /lecturas y GET /comandos/pendiente). accion siempre es "REGAR". */
public record ComandoEntregado(Long id, String accion, Integer duracionSeg) {

	public static final String REGAR = "REGAR";

}

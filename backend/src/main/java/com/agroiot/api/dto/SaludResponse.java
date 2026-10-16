package com.agroiot.api.dto;

import java.time.Instant;

/** GET /salud. estado = OK | DEGRADADO; baseDatos = OK | ERROR; firebase = OK | ERROR | NO_CONFIGURADO. */
public record SaludResponse(String estado, String baseDatos, String firebase, Instant hora) {
}

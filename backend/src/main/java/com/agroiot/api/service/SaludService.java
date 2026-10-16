package com.agroiot.api.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.agroiot.api.dto.SaludResponse;

@Service
public class SaludService {

	private static final Logger log = LoggerFactory.getLogger(SaludService.class);

	private final JdbcTemplate jdbc;

	public SaludService(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	/** Siempre responde: si la BD falla, baseDatos = ERROR y estado = DEGRADADO. */
	public SaludResponse revisar() {
		String baseDatos;
		try {
			jdbc.queryForObject("SELECT 1", Integer.class);
			baseDatos = "OK";
		} catch (RuntimeException ex) {
			log.warn("Salud: la base de datos no responde: {}", ex.getMessage());
			baseDatos = "ERROR";
		}
		// TODO: verificar Firebase cuando se integre el Admin SDK.
		String firebase = "NO_CONFIGURADO";
		String estado = "OK".equals(baseDatos) && !"ERROR".equals(firebase) ? "OK" : "DEGRADADO";
		return new SaludResponse(estado, baseDatos, firebase, Instant.now());
	}

}

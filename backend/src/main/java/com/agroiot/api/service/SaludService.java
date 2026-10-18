package com.agroiot.api.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.agroiot.api.dto.SaludResponse;
import com.agroiot.api.firebase.FirebaseCliente;

@Service
public class SaludService {

	private static final Logger log = LoggerFactory.getLogger(SaludService.class);

	private final JdbcTemplate jdbc;
	private final FirebaseCliente firebase;

	public SaludService(JdbcTemplate jdbc, FirebaseCliente firebase) {
		this.jdbc = jdbc;
		this.firebase = firebase;
	}

	/** Siempre responde: si la BD o Firebase fallan, ese campo = ERROR y estado = DEGRADADO. */
	public SaludResponse revisar() {
		String baseDatos;
		try {
			jdbc.queryForObject("SELECT 1", Integer.class);
			baseDatos = "OK";
		} catch (RuntimeException ex) {
			log.warn("Salud: la base de datos no responde: {}", ex.getMessage());
			baseDatos = "ERROR";
		}
		String firebase = this.firebase.revisar();
		String estado = "OK".equals(baseDatos) && !"ERROR".equals(firebase) ? "OK" : "DEGRADADO";
		return new SaludResponse(estado, baseDatos, firebase, Instant.now());
	}

}

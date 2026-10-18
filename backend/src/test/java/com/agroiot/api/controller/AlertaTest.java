package com.agroiot.api.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

/**
 * Fase 4: alertas por umbral (reglas iniciales de db/schema.sql), listado y resolución.
 * Reglas usadas: TEMPERATURA > 32 y < 10, HUMEDAD_SUELO < 25. Cada prueba se revierte al terminar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AlertaTest {

	private static final String ALERTAS = "/api/dispositivos/maceta-01/alertas";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Value("${agroiot.device-api-key}")
	private String apiKey;

	@BeforeEach
	void estadoInicial() {
		jdbc.update("DELETE FROM alerta WHERE dispositivo_id = 'maceta-01'");
		// Sin riego automático para que las lecturas de suelo seco no creen comandos.
		jdbc.update("UPDATE dispositivo SET riego_automatico = FALSE WHERE id = 'maceta-01'");
	}

	/** Lectura en tiempo real con pares tipo, valor. */
	private ResultActions lectura(String... tipoValor) throws Exception {
		return lecturaEn(null, tipoValor);
	}

	private ResultActions lecturaEn(Instant medidaEn, String... tipoValor) throws Exception {
		StringBuilder mediciones = new StringBuilder();
		for (int i = 0; i < tipoValor.length; i += 2) {
			if (i > 0) mediciones.append(',');
			mediciones.append("{ \"tipo\": \"").append(tipoValor[i]).append("\", \"valor\": ")
					.append(tipoValor[i + 1]).append(" }");
		}
		String fecha = medidaEn == null ? "" : "\"medidaEn\": \"" + medidaEn + "\",";
		return mvc.perform(post("/api/lecturas").header("X-Api-Key", apiKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{ \"dispositivoId\": \"maceta-01\", " + fecha + " \"mediciones\": [" + mediciones + "] }"))
				.andExpect(status().isCreated());
	}

	private ResultActions activas() throws Exception {
		return mvc.perform(get(ALERTAS)).andExpect(status().isOk());
	}

	// --- Apertura y cierre automáticos --------------------------------------

	@Test
	void seAbreAlCruzarElUmbral_yNoSeDuplica() throws Exception {
		lectura("TEMPERATURA", "32"); // igual al umbral: no lo cruza
		activas().andExpect(jsonPath("$", hasSize(0)));

		lectura("TEMPERATURA", "34.2");
		lectura("TEMPERATURA", "35"); // sigue alta: no abre otra
		activas()
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].tipoSensor").value("TEMPERATURA"))
				.andExpect(jsonPath("$[0].severidad").value("ADVERTENCIA"))
				.andExpect(jsonPath("$[0].mensaje").value("Temperatura alta"))
				.andExpect(jsonPath("$[0].valor").value(34.2))
				.andExpect(jsonPath("$[0].resueltaEn").isEmpty());
	}

	@Test
	void seCierraSolaCuandoVuelveALoNormal() throws Exception {
		lectura("TEMPERATURA", "34");
		lectura("TEMPERATURA", "25");

		activas().andExpect(jsonPath("$", hasSize(0)));
		mvc.perform(get(ALERTAS + "?estado=TODAS"))
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].resueltaEn").isNotEmpty());
	}

	@Test
	void unSensorQueNoVieneNoAbreNiCierra() throws Exception {
		lectura("TEMPERATURA", "34");
		lectura("HUMEDAD_SUELO", "50"); // sin TEMPERATURA: la alerta sigue abierta
		activas().andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void variasReglasEnUnaLectura() throws Exception {
		lectura("HUMEDAD_SUELO", "20", "TEMPERATURA", "5");
		activas()
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[?(@.mensaje == 'Temperatura baja')]", hasSize(1)))
				.andExpect(jsonPath("$[?(@.mensaje == 'Suelo seco: la planta necesita agua')]", hasSize(1)));
	}

	@Test
	void elHistorialNoAbreAlertas() throws Exception {
		lecturaEn(Instant.now().minus(10, ChronoUnit.MINUTES), "TEMPERATURA", "40");
		activas().andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void ordenadasDeLaMasRecienteALaMasAntigua() throws Exception {
		lectura("TEMPERATURA", "34");
		lectura("HUMEDAD_SUELO", "20");
		activas()
				.andExpect(jsonPath("$[0].tipoSensor").value("HUMEDAD_SUELO"))
				.andExpect(jsonPath("$[1].tipoSensor").value("TEMPERATURA"));
	}

	// --- Resolver a mano ----------------------------------------------------

	@Test
	void resolver_marcaResueltaYSePuedeRepetir() throws Exception {
		lectura("TEMPERATURA", "34");
		String cuerpo = activas().andReturn().getResponse().getContentAsString();
		long id = ((Number) JsonPath.read(cuerpo, "$[0].id")).longValue();

		String primera = mvc.perform(post("/api/alertas/" + id + "/resolver"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id))
				.andExpect(jsonPath("$.resueltaEn").isNotEmpty())
				.andReturn().getResponse().getContentAsString();
		String resueltaEn = JsonPath.read(primera, "$.resueltaEn");

		// Repetir no cambia nada.
		mvc.perform(post("/api/alertas/" + id + "/resolver"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.resueltaEn").value(resueltaEn));
		activas().andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void resolver_siLaCondicionSigue_laSiguienteLecturaAbreOtra() throws Exception {
		lectura("TEMPERATURA", "34");
		long id = ((Number) JsonPath.read(activas().andReturn().getResponse().getContentAsString(), "$[0].id"))
				.longValue();
		mvc.perform(post("/api/alertas/" + id + "/resolver")).andExpect(status().isOk());

		lectura("TEMPERATURA", "34");
		activas()
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].id").value(not((int) id)));
	}

	// --- Errores -------------------------------------------------------------

	@Test
	void errores() throws Exception {
		mvc.perform(post("/api/alertas/999999999/resolver"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("ALERTA_NO_ENCONTRADA"));
		mvc.perform(get(ALERTAS + "?estado=OTRA")).andExpect(status().isBadRequest());
		mvc.perform(get(ALERTAS + "?limite=0")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/dispositivos/maceta-99/alertas"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("DISPOSITIVO_NO_ENCONTRADO"));
	}

}

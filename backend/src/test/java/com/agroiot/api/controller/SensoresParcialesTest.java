package com.agroiot.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
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

/**
 * Fase 7: la lista "Pruebas de los modos con sensores parciales" del contrato, en la parte que le toca a la API.
 * Lo que es solo del dashboard (tarjetas en gris, botón deshabilitado) se prueba en el frontend. Cada prueba parte
 * de maceta-01 sin datos ni sensores detectados, con la configuración inicial, y se revierte al terminar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SensoresParcialesTest {

	private static final String DISPOSITIVO = "/api/dispositivos/maceta-01";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Value("${agroiot.device-api-key}")
	private String apiKey;

	@BeforeEach
	void estadoInicial() {
		jdbc.update("DELETE FROM lectura WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM dispositivo_sensor WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM comando_riego WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM alerta WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("""
				UPDATE dispositivo SET tiene_bomba = TRUE, riego_automatico = TRUE, umbral_riego = 35,
				       duracion_riego_seg = 5, espera_riego_min = 10
				WHERE id = 'maceta-01'
				""");
	}

	/** Lectura con pares tipo, valor; medidaEn null = ahora (tiempo real). No revisa el estado HTTP. */
	private ResultActions lectura(Instant medidaEn, String... tipoValor) throws Exception {
		StringBuilder mediciones = new StringBuilder();
		for (int i = 0; i < tipoValor.length; i += 2) {
			if (i > 0) mediciones.append(',');
			mediciones.append("{ \"tipo\": \"").append(tipoValor[i]).append("\", \"valor\": ")
					.append(tipoValor[i + 1]).append(" }");
		}
		String fecha = medidaEn == null ? "" : "\"medidaEn\": \"" + medidaEn + "\",";
		return mvc.perform(post("/api/lecturas").header("X-Api-Key", apiKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{ \"dispositivoId\": \"maceta-01\", " + fecha + " \"mediciones\": [" + mediciones + "] }"));
	}

	private int filas(String tabla) {
		return jdbc.queryForObject("SELECT COUNT(*) FROM " + tabla + " WHERE dispositivo_id = 'maceta-01'",
				Integer.class);
	}

	@Test
	void soloSuelo_bajoElUmbral_elRiegoLlegaEnLaMismaLectura() throws Exception {
		lectura(null, "HUMEDAD_SUELO", "30")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.comando.accion").value("REGAR"));
		mvc.perform(get(DISPOSITIVO + "/riegos")).andExpect(jsonPath("$[0].origen").value("AUTOMATICO"));
	}

	@Test
	void temperaturaYAire_dosSensores_riegoManualSiYAutomaticoNo() throws Exception {
		lectura(null, "TEMPERATURA", "24", "HUMEDAD_AIRE", "60")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.comando").isEmpty());

		mvc.perform(get(DISPOSITIVO))
				.andExpect(jsonPath("$.sensores", hasSize(2)))
				.andExpect(jsonPath("$.sensores[0].tipo").value("HUMEDAD_AIRE"))
				.andExpect(jsonPath("$.sensores[0].estado").value("ACTIVO"))
				.andExpect(jsonPath("$.sensores[1].tipo").value("TEMPERATURA"))
				// Sin sensor de suelo no hay riego automático, aunque esté activado.
				.andExpect(jsonPath("$.riegoAutomatico").value(true))
				.andExpect(jsonPath("$.riegoAutomaticoDisponible").value(false));

		mvc.perform(post(DISPOSITIVO + "/riegos")).andExpect(status().isAccepted())
				.andExpect(jsonPath("$.humedadSueloAntes").isEmpty());
	}

	@Test
	void unSensorDejaDeEnviar_quedaSinDatosYConservaSuHistorial() throws Exception {
		lectura(Instant.now().minus(3, ChronoUnit.MINUTES), "TEMPERATURA", "24", "HUMEDAD_SUELO", "50");
		lectura(null, "HUMEDAD_SUELO", "49"); // la temperatura ya no viene

		mvc.perform(get(DISPOSITIVO))
				.andExpect(jsonPath("$.sensores[?(@.tipo == 'HUMEDAD_SUELO')].estado").value("ACTIVO"))
				.andExpect(jsonPath("$.sensores[?(@.tipo == 'TEMPERATURA')].estado").value("SIN_DATOS"))
				.andExpect(jsonPath("$.sensores[?(@.tipo == 'TEMPERATURA')].ultimoValor").value(24.0));
		mvc.perform(get(DISPOSITIVO + "/mediciones?tipos=TEMPERATURA"))
				.andExpect(jsonPath("$.series[0].tipo").value("TEMPERATURA"))
				.andExpect(jsonPath("$.series[0].puntos", hasSize(1)));
	}

	@Test
	void sueloEn150_soloEsaSeDescarta() throws Exception {
		lectura(null, "HUMEDAD_SUELO", "150", "TEMPERATURA", "24")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.aceptadas", hasSize(1)))
				.andExpect(jsonPath("$.aceptadas[0]").value("TEMPERATURA"))
				.andExpect(jsonPath("$.descartadas", hasSize(1)))
				.andExpect(jsonPath("$.descartadas[0].tipo").value("HUMEDAD_SUELO"))
				.andExpect(jsonPath("$.descartadas[0].valor").value(150))
				.andExpect(jsonPath("$.descartadas[0].motivo").value("FUERA_DE_RANGO"));
		// El valor descartado no cuenta para el riego automático ni para las alertas.
		assertThat(filas("comando_riego")).isZero();
	}

	@Test
	void todasInvalidas_422YNoSeGuardaNada() throws Exception {
		lectura(null, "HUMEDAD_SUELO", "150", "CO2", "400", "HUMEDAD_SUELO", "40")
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.codigo").value("SIN_MEDICIONES_VALIDAS"));
		assertThat(filas("lectura")).isZero();
	}

	@Test
	void motivosDeDescarte_duplicadoYTipoDesconocido() throws Exception {
		lectura(null, "TEMPERATURA", "24", "TEMPERATURA", "25", "CO2", "400")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.aceptadas", hasSize(1)))
				.andExpect(jsonPath("$.descartadas[?(@.tipo == 'TEMPERATURA')].motivo").value("DUPLICADO"))
				.andExpect(jsonPath("$.descartadas[?(@.tipo == 'CO2')].motivo").value("TIPO_DESCONOCIDO"));
	}

	@Test
	void historialDe24h_noCreaRiegosNiAlertas() throws Exception {
		Instant hace24h = Instant.now().minus(24, ChronoUnit.HOURS);
		for (int h = 0; h < 24; h++) {
			// Suelo seco y calor: en tiempo real abrirían alertas y regarían.
			lectura(hace24h.plus(h, ChronoUnit.HOURS), "HUMEDAD_SUELO", "10", "TEMPERATURA", "40")
					.andExpect(status().isCreated())
					.andExpect(jsonPath("$.comando").isEmpty());
		}
		assertThat(filas("lectura")).isEqualTo(24);
		assertThat(filas("comando_riego")).isZero();
		assertThat(filas("alerta")).isZero();
	}

}

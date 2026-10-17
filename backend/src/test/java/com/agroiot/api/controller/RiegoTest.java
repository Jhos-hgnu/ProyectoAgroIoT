package com.agroiot.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
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
 * Fase 3: riego manual, automático y ciclo PENDIENTE → ENVIADO → EJECUTADO / FALLIDO / EXPIRADO.
 * Cada prueba corre en una transacción que se revierte; parte sin comandos y con la configuración inicial.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RiegoTest {

	private static final String DISPOSITIVO = "/api/dispositivos/maceta-01";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Value("${agroiot.device-api-key}")
	private String apiKey;

	@BeforeEach
	void estadoInicial() {
		jdbc.update("DELETE FROM comando_riego WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("""
				UPDATE dispositivo SET tiene_bomba = TRUE, riego_automatico = TRUE, umbral_riego = 35,
				       duracion_riego_seg = 5, espera_riego_min = 10
				WHERE id = 'maceta-01'
				""");
	}

	// --- Ayudas -----------------------------------------------------------

	private ResultActions regar(String cuerpo) throws Exception {
		var req = post(DISPOSITIVO + "/riegos");
		if (cuerpo != null) req.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
		return mvc.perform(req);
	}

	/** Lectura del ESP32 con humedad del suelo; medidaEn null = ahora (tiempo real). */
	private ResultActions lectura(String humedadSuelo, Instant medidaEn) throws Exception {
		String fecha = medidaEn == null ? "" : "\"medidaEn\": \"" + medidaEn + "\",";
		return mvc.perform(post("/api/lecturas").header("X-Api-Key", apiKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{ \"dispositivoId\": \"maceta-01\", " + fecha
						+ " \"mediciones\": [{ \"tipo\": \"HUMEDAD_SUELO\", \"valor\": " + humedadSuelo + " }] }"));
	}

	private ResultActions confirmar(long comandoId, String dispositivo, String estado) throws Exception {
		return mvc.perform(post("/api/comandos/" + comandoId + "/confirmacion").header("X-Api-Key", apiKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{ \"dispositivoId\": \"" + dispositivo + "\", \"estado\": \"" + estado
						+ "\", \"detalle\": null }"));
	}

	private static long id(ResultActions r, String ruta) throws Exception {
		return ((Number) JsonPath.read(r.andReturn().getResponse().getContentAsString(), ruta)).longValue();
	}

	private String estadoEnBase(long comandoId) {
		return jdbc.queryForObject("SELECT estado FROM comando_riego WHERE id = ?", String.class, comandoId);
	}

	// --- Riego manual -------------------------------------------------------

	@Test
	void manual_quedaPendienteConLaDuracionConfigurada() throws Exception {
		regar(null)
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.origen").value("MANUAL"))
				.andExpect(jsonPath("$.estado").value("PENDIENTE"))
				.andExpect(jsonPath("$.duracionSeg").value(5))
				.andExpect(jsonPath("$.finalizadoEn").isEmpty());
	}

	@Test
	void manual_aceptaDuracionYLaValida() throws Exception {
		regar("{ \"duracionSeg\": 8 }").andExpect(status().isAccepted()).andExpect(jsonPath("$.duracionSeg").value(8));
		jdbc.update("DELETE FROM comando_riego WHERE dispositivo_id = 'maceta-01'");
		regar("{ \"duracionSeg\": 61 }").andExpect(status().isBadRequest());
	}

	@Test
	void manual_guardaLaUltimaHumedadDelSuelo() throws Exception {
		lectura("41.5", null).andExpect(status().isCreated());
		regar(null).andExpect(jsonPath("$.humedadSueloAntes").value(41.5));
	}

	@Test
	void manual_conRiegoAbierto_responde409() throws Exception {
		regar(null).andExpect(status().isAccepted());
		regar(null).andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("RIEGO_EN_CURSO"));
	}

	@Test
	void manual_sinBomba_responde409() throws Exception {
		jdbc.update("UPDATE dispositivo SET tiene_bomba = FALSE WHERE id = 'maceta-01'");
		regar(null).andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("BOMBA_NO_DISPONIBLE"));
	}

	@Test
	void manual_dispositivoInexistente_responde404() throws Exception {
		mvc.perform(post("/api/dispositivos/maceta-99/riegos")).andExpect(status().isNotFound());
	}

	// --- Ciclo completo -----------------------------------------------------

	@Test
	void ciclo_pendienteEnviadoEjecutado() throws Exception {
		long comando = id(regar(null), "$.id");

		// La siguiente lectura lo entrega y lo marca ENVIADO.
		lectura("50", null).andExpect(jsonPath("$.comando.id").value(comando))
				.andExpect(jsonPath("$.comando.accion").value("REGAR"))
				.andExpect(jsonPath("$.comando.duracionSeg").value(5));
		mvc.perform(get(DISPOSITIVO + "/riegos")).andExpect(jsonPath("$[0].estado").value("ENVIADO"));
		// No se entrega dos veces.
		lectura("50", null).andExpect(jsonPath("$.comando").isEmpty());

		confirmar(comando, "maceta-01", "EJECUTADO")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(comando))
				.andExpect(jsonPath("$.estado").value("EJECUTADO"));

		mvc.perform(get(DISPOSITIVO + "/riegos"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(comando))
				.andExpect(jsonPath("$[0].estado").value("EJECUTADO"))
				.andExpect(jsonPath("$[0].finalizadoEn").isNotEmpty());

		// Ya no está ENVIADO: una segunda confirmación es 409.
		confirmar(comando, "maceta-01", "EJECUTADO")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.codigo").value("COMANDO_NO_ENVIADO"));
	}

	@Test
	void ciclo_fallido_abreAlertaCritica() throws Exception {
		long comando = id(regar(null), "$.id");
		lectura("50", null);
		confirmar(comando, "maceta-01", "FALLIDO").andExpect(jsonPath("$.estado").value("FALLIDO"));

		Integer alertas = jdbc.queryForObject("""
				SELECT count(*) FROM alerta
				WHERE dispositivo_id = 'maceta-01' AND severidad = 'CRITICA' AND regla_id IS NULL
				  AND resuelta_en IS NULL AND mensaje LIKE ?
				""", Integer.class, "%#" + comando + ")");
		assertThat(alertas).isEqualTo(1);
	}

	@Test
	void ciclo_sinConfirmarEn2Minutos_expira() throws Exception {
		Long comando = jdbc.queryForObject("""
				INSERT INTO comando_riego (dispositivo_id, origen, estado, duracion_seg, creado_en, enviado_en)
				VALUES ('maceta-01', 'MANUAL', 'ENVIADO', 5, now() - INTERVAL '3 minutes', now() - INTERVAL '3 minutes')
				RETURNING id
				""", Long.class);

		confirmar(comando, "maceta-01", "EJECUTADO").andExpect(status().isConflict());
		assertThat(estadoEnBase(comando)).isEqualTo("EXPIRADO");
		// Expirado, ya no bloquea un riego nuevo.
		regar(null).andExpect(status().isAccepted());
	}

	@Test
	void confirmar_errores() throws Exception {
		long comando = id(regar(null), "$.id");
		// Todavía PENDIENTE: el ESP32 no lo ha recibido.
		confirmar(comando, "maceta-01", "EJECUTADO").andExpect(status().isConflict());
		// De otro dispositivo o inexistente.
		confirmar(comando, "maceta-99", "EJECUTADO").andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("COMANDO_NO_ENCONTRADO"));
		confirmar(999_999_999L, "maceta-01", "EJECUTADO").andExpect(status().isNotFound());
		// Estado que no es EJECUTADO ni FALLIDO.
		confirmar(comando, "maceta-01", "EXPIRADO").andExpect(status().isBadRequest());
		// Sin clave.
		mvc.perform(post("/api/comandos/" + comando + "/confirmacion").contentType(MediaType.APPLICATION_JSON)
				.content("{ \"dispositivoId\": \"maceta-01\", \"estado\": \"EJECUTADO\" }"))
				.andExpect(status().isUnauthorized());
	}

	// --- Riego automático ---------------------------------------------------

	@Test
	void automatico_sueloBajoElUmbral_seEntregaEnLaMismaLectura() throws Exception {
		lectura("30", null)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.comando.accion").value("REGAR"));

		mvc.perform(get(DISPOSITIVO + "/riegos"))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].origen").value("AUTOMATICO"))
				.andExpect(jsonPath("$[0].estado").value("ENVIADO"))
				.andExpect(jsonPath("$[0].humedadSueloAntes").value(30.0));

		// Con el riego abierto no se crea otro.
		lectura("29", null).andExpect(jsonPath("$.comando").isEmpty());
		mvc.perform(get(DISPOSITIVO + "/riegos")).andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void automatico_noSeDisparaSiNoCorresponde() throws Exception {
		// Suelo sobre el umbral.
		lectura("36", null).andExpect(jsonPath("$.comando").isEmpty());
		// Lectura histórica (hace 10 min).
		lectura("20", Instant.now().minus(10, ChronoUnit.MINUTES)).andExpect(jsonPath("$.comando").isEmpty());
		// Riego automático apagado.
		jdbc.update("UPDATE dispositivo SET riego_automatico = FALSE WHERE id = 'maceta-01'");
		lectura("20", null).andExpect(jsonPath("$.comando").isEmpty());
		// Sin bomba.
		jdbc.update("UPDATE dispositivo SET riego_automatico = TRUE, tiene_bomba = FALSE WHERE id = 'maceta-01'");
		lectura("20", null).andExpect(jsonPath("$.comando").isEmpty());

		mvc.perform(get(DISPOSITIVO + "/riegos")).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void automatico_respetaLaEsperaEntreRiegos() throws Exception {
		jdbc.update("""
				INSERT INTO comando_riego (dispositivo_id, origen, estado, duracion_seg, creado_en, finalizado_en)
				VALUES ('maceta-01', 'AUTOMATICO', 'EJECUTADO', 5, now() - INTERVAL '5 minutes', now() - INTERVAL '5 minutes')
				""");
		lectura("20", null).andExpect(jsonPath("$.comando").isEmpty());

		jdbc.update("UPDATE comando_riego SET creado_en = now() - INTERVAL '11 minutes' WHERE dispositivo_id = 'maceta-01'");
		lectura("20", null).andExpect(jsonPath("$.comando.accion").value("REGAR"));
	}

	// --- Historial ----------------------------------------------------------

	@Test
	void historial_validaElLimite() throws Exception {
		mvc.perform(get(DISPOSITIVO + "/riegos?limite=0")).andExpect(status().isBadRequest());
		mvc.perform(get(DISPOSITIVO + "/riegos?limite=101")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/dispositivos/maceta-99/riegos")).andExpect(status().isNotFound());
	}

}

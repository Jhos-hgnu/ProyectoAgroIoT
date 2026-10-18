package com.agroiot.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

/**
 * Fase 6: reportes de IA. Gemini se reemplaza por un ChatModel simulado, así que no se gasta cuota.
 * Cada prueba parte sin lecturas, alertas, riegos ni reportes de maceta-01 y se revierte al terminar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReporteTest {

	private static final String REPORTES = "/api/dispositivos/maceta-01/reportes";
	private static final String CONTENIDO = "## Resumen\nTodo en orden.";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@MockitoBean
	private ChatModel modelo;

	@Value("${agroiot.device-api-key}")
	private String apiKey;

	@BeforeEach
	void estadoInicial() {
		jdbc.update("DELETE FROM reporte_ia WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM lectura WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM alerta WHERE dispositivo_id = 'maceta-01'");
		jdbc.update("DELETE FROM comando_riego WHERE dispositivo_id = 'maceta-01'");
		when(modelo.call(any(Prompt.class)))
				.thenReturn(new ChatResponse(List.of(new Generation(new AssistantMessage(CONTENIDO)))));
	}

	/** n lecturas de historial (una por minuto, hace más de 2 min: no abren alertas ni riegos) con los pares dados. */
	private void historial(int n, Instant inicio, String... tipoValor) throws Exception {
		StringBuilder mediciones = new StringBuilder();
		for (int i = 0; i < tipoValor.length; i += 2) {
			if (i > 0) mediciones.append(',');
			mediciones.append("{ \"tipo\": \"").append(tipoValor[i]).append("\", \"valor\": ")
					.append(tipoValor[i + 1]).append(" }");
		}
		for (int i = 0; i < n; i++) {
			Instant medidaEn = inicio.plus(i, ChronoUnit.MINUTES);
			mvc.perform(post("/api/lecturas").header("X-Api-Key", apiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{ \"dispositivoId\": \"maceta-01\", \"medidaEn\": \"" + medidaEn + "\", \"mediciones\": ["
							+ mediciones + "] }"))
					.andExpect(status().isCreated());
		}
	}

	private Instant haceMinutos(int minutos) {
		return Instant.now().minus(minutos, ChronoUnit.MINUTES);
	}

	private ResultActions generar(String cuerpo) throws Exception {
		return mvc.perform(post(REPORTES).contentType(MediaType.APPLICATION_JSON).content(cuerpo));
	}

	private String promptEnviado() {
		ArgumentCaptor<Prompt> prompt = ArgumentCaptor.forClass(Prompt.class);
		verify(modelo).call(prompt.capture());
		return prompt.getValue().getContents();
	}

	private int reportesGuardados() {
		return jdbc.queryForObject("SELECT COUNT(*) FROM reporte_ia WHERE dispositivo_id = 'maceta-01'",
				Integer.class);
	}

	// --- Generar ------------------------------------------------------------

	@Test
	void conUnSensor_losDemasVanComoSinDatos() throws Exception {
		historial(12, haceMinutos(30), "TEMPERATURA", "24.5");

		generar("{ \"horas\": 24 }")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.sensores", hasSize(1)))
				.andExpect(jsonPath("$.sensores[0]").value("TEMPERATURA"))
				.andExpect(jsonPath("$.sensoresSinDatos", hasSize(3)))
				.andExpect(jsonPath("$.sensoresSinDatos[0]").value("HUMEDAD_AIRE"))
				.andExpect(jsonPath("$.sensoresSinDatos[1]").value("HUMEDAD_SUELO"))
				.andExpect(jsonPath("$.sensoresSinDatos[2]").value("LUZ"))
				.andExpect(jsonPath("$.contenido").value(CONTENIDO))
				.andExpect(jsonPath("$.modelo").value("gemini-2.5-flash"))
				.andExpect(jsonPath("$.creadoEn").isNotEmpty());

		String prompt = promptEnviado();
		assertThat(prompt)
				.contains("Sensores con datos: TEMPERATURA.")
				.contains("Sensores sin datos: HUMEDAD_AIRE, HUMEDAD_SUELO, LUZ.")
				.contains("\"sensoresConDatos\":[\"TEMPERATURA\"]")
				.contains("\"muestras\":12")
				.doesNotContain("{json}");
		assertThat(reportesGuardados()).isEqualTo(1);
	}

	@Test
	void conCuatroSensores_noHaySensoresSinDatos() throws Exception {
		historial(3, haceMinutos(30), "HUMEDAD_SUELO", "40", "TEMPERATURA", "24", "HUMEDAD_AIRE", "60", "LUZ", "70");

		generar("{}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.sensores", hasSize(4)))
				.andExpect(jsonPath("$.sensoresSinDatos", hasSize(0)));
		assertThat(promptEnviado()).contains("Sensores sin datos: ninguno.");
	}

	@Test
	void elJsonGuardadoEsElQueSeEnvio_conRiegosYAlertasDeLaVentana() throws Exception {
		historial(10, haceMinutos(30), "HUMEDAD_SUELO", "40");
		jdbc.update("""
				INSERT INTO comando_riego (dispositivo_id, origen, duracion_seg, estado, creado_en)
				VALUES ('maceta-01', 'MANUAL', 5, 'EJECUTADO', now() - INTERVAL '10 minutes')""");
		jdbc.update("""
				INSERT INTO alerta (dispositivo_id, severidad, mensaje, creada_en)
				VALUES ('maceta-01', 'CRITICA', 'La bomba no se activó', now() - INTERVAL '5 minutes')""");

		String respuesta = generar("{}").andExpect(status().isCreated()).andReturn().getResponse()
				.getContentAsString();
		Number id = JsonPath.read(respuesta, "$.id");
		String guardado = jdbc.queryForObject("SELECT resumen_entrada FROM reporte_ia WHERE id = ?", String.class,
				id.longValue());

		assertThat(promptEnviado()).contains(guardado);
		assertThat(guardado)
				.contains("\"origen\":\"MANUAL\"")
				.contains("\"estado\":\"EJECUTADO\"")
				.contains("La bomba no se activó")
				.contains("\"resumenPorHora\"");
	}

	@Test
	void menosDeDiezMediciones_422YNoLlamaAlModelo() throws Exception {
		historial(9, haceMinutos(30), "TEMPERATURA", "24");

		generar("{}")
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.codigo").value("DATOS_INSUFICIENTES"));
		verify(modelo, never()).call(any(Prompt.class));
	}

	@Test
	void soloCuentaLaVentanaPedida() throws Exception {
		historial(12, haceMinutos(180), "TEMPERATURA", "24"); // hace 3 h: fuera de la ventana de 1 h

		generar("{ \"horas\": 1 }")
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.codigo").value("DATOS_INSUFICIENTES"));
	}

	@Test
	void siElModeloFalla_502YNoSeGuardaNada() throws Exception {
		historial(10, haceMinutos(30), "TEMPERATURA", "24");
		when(modelo.call(any(Prompt.class))).thenThrow(new RuntimeException("429 cuota agotada"));

		generar("{}")
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.codigo").value("IA_NO_DISPONIBLE"));
		assertThat(reportesGuardados()).isZero();
	}

	@Test
	void siElModeloRespondeVacio_502() throws Exception {
		historial(10, haceMinutos(30), "TEMPERATURA", "24");
		when(modelo.call(any(Prompt.class)))
				.thenReturn(new ChatResponse(List.of(new Generation(new AssistantMessage("  ")))));

		generar("{}")
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.codigo").value("IA_NO_DISPONIBLE"));
		assertThat(reportesGuardados()).isZero();
	}

	@Test
	void horasFueraDeRango_400() throws Exception {
		generar("{ \"horas\": 73 }").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.codigo").value("VALIDACION"));
		generar("{ \"horas\": 0 }").andExpect(status().isBadRequest());
	}

	@Test
	void dispositivoInexistente_404() throws Exception {
		mvc.perform(post("/api/dispositivos/no-existe/reportes"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("DISPOSITIVO_NO_ENCONTRADO"));
	}

	// --- Consultar ----------------------------------------------------------

	@Test
	void listaSinContenido_yDetalleCompleto() throws Exception {
		historial(10, haceMinutos(30), "TEMPERATURA", "24");
		String primero = generar("{}").andReturn().getResponse().getContentAsString();
		String segundo = generar("{ \"horas\": 12 }").andReturn().getResponse().getContentAsString();
		Number idPrimero = JsonPath.read(primero, "$.id");
		Number idSegundo = JsonPath.read(segundo, "$.id");

		mvc.perform(get(REPORTES))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].id").value(idSegundo.longValue()))
				.andExpect(jsonPath("$[1].id").value(idPrimero.longValue()))
				.andExpect(jsonPath("$[0].sensores[0]").value("TEMPERATURA"))
				.andExpect(jsonPath("$[0].sensoresSinDatos", hasSize(3)))
				.andExpect(jsonPath("$[0].contenido").doesNotExist());
		mvc.perform(get(REPORTES + "?limite=1")).andExpect(jsonPath("$", hasSize(1)));

		mvc.perform(get("/api/reportes/" + idPrimero))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido").value(CONTENIDO))
				.andExpect(jsonPath("$.sensoresSinDatos", hasSize(3)));
	}

	@Test
	void reporteInexistente_404() throws Exception {
		mvc.perform(get("/api/reportes/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("REPORTE_NO_ENCONTRADO"));
	}

}

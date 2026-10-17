package com.agroiot.api.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fase 2: GET /dispositivos/{id}/mediciones y PATCH /dispositivos/{id}.
 * Usa la base local (db/schema.sql). Cada prueba corre en una transacción que se revierte al terminar,
 * y los datos se insertan en enero de 2020 para no mezclarse con los del simulador.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DispositivoControllerTest {

	private static final String URL = "/api/dispositivos/maceta-01";
	private static final String RANGO = "desde=2020-01-01T10:00:00Z&hasta=2020-01-01T12:00:00Z";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@BeforeEach
	void datos() {
		// 10:00 h → suelo 40 y 50 (promedio 45), temperatura 24.5; 11:00 h → solo suelo 30.
		lectura("2020-01-01T10:05:00Z", "HUMEDAD_SUELO", "40", "TEMPERATURA", "24.5");
		lectura("2020-01-01T10:35:00Z", "HUMEDAD_SUELO", "50");
		lectura("2020-01-01T11:10:00Z", "HUMEDAD_SUELO", "30");
	}

	private void lectura(String medidaEn, String... tipoValor) {
		Long id = jdbc.queryForObject(
				"INSERT INTO lectura (dispositivo_id, medida_en) VALUES ('maceta-01', ?::timestamptz) RETURNING id",
				Long.class, medidaEn);
		for (int i = 0; i < tipoValor.length; i += 2) {
			jdbc.update("INSERT INTO medicion (lectura_id, tipo_sensor, valor) VALUES (?, ?, ?)",
					id, tipoValor[i], new BigDecimal(tipoValor[i + 1]));
		}
	}

	// --- GET /mediciones ---------------------------------------------------

	@Test
	void sinAgrupar_devuelveCadaValorSinMinNiMax() throws Exception {
		mvc.perform(get(URL + "/mediciones?" + RANGO))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.agrupacion").value("NINGUNA"))
				.andExpect(jsonPath("$.desde").value("2020-01-01T10:00:00Z"))
				.andExpect(jsonPath("$.series.length()").value(2))
				.andExpect(jsonPath("$.series[0].tipo").value("HUMEDAD_SUELO"))
				.andExpect(jsonPath("$.series[0].unidad").value("%"))
				.andExpect(jsonPath("$.series[0].puntos.length()").value(3))
				.andExpect(jsonPath("$.series[0].puntos[0].t").value("2020-01-01T10:05:00Z"))
				.andExpect(jsonPath("$.series[0].puntos[0].min").doesNotExist())
				.andExpect(jsonPath("$.series[1].tipo").value("TEMPERATURA"))
				.andExpect(jsonPath("$.series[1].unidad").value("°C"));
	}

	@Test
	void porHora_promediaYAgregaMinYMax() throws Exception {
		mvc.perform(get(URL + "/mediciones?agrupacion=HORA&" + RANGO))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.series[0].puntos.length()").value(2))
				.andExpect(jsonPath("$.series[0].puntos[0].t").value("2020-01-01T10:00:00Z"))
				.andExpect(jsonPath("$.series[0].puntos[0].valor").value(45.0))
				.andExpect(jsonPath("$.series[0].puntos[0].min").value(40.0))
				.andExpect(jsonPath("$.series[0].puntos[0].max").value(50.0))
				.andExpect(jsonPath("$.series[0].puntos[1].t").value("2020-01-01T11:00:00Z"))
				.andExpect(jsonPath("$.series[0].puntos[1].valor").value(30.0));
	}

	@Test
	void filtraPorTipos_sinImportarMayusculas() throws Exception {
		mvc.perform(get(URL + "/mediciones?tipos=temperatura&" + RANGO))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.series.length()").value(1))
				.andExpect(jsonPath("$.series[0].tipo").value("TEMPERATURA"));
	}

	@Test
	void rangoSinDatos_devuelveSeriesVacias() throws Exception {
		mvc.perform(get(URL + "/mediciones?desde=2019-01-01T00:00:00Z&hasta=2019-01-02T00:00:00Z"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.series.length()").value(0));
	}

	@Test
	void errores_deMediciones() throws Exception {
		mvc.perform(get(URL + "/mediciones?tipos=CO2"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.codigo").value("VALIDACION"));
		mvc.perform(get(URL + "/mediciones?desde=2020-01-02T00:00:00Z&hasta=2020-01-01T00:00:00Z"))
				.andExpect(status().isBadRequest());
		mvc.perform(get(URL + "/mediciones?agrupacion=DIA"))
				.andExpect(status().isBadRequest());
		mvc.perform(get("/api/dispositivos/maceta-99/mediciones"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.codigo").value("DISPOSITIVO_NO_ENCONTRADO"));
	}

	@Test
	void sinAgrupar_permiteHasta24Horas() throws Exception {
		mvc.perform(get(URL + "/mediciones?desde=2020-01-01T00:00:00Z&hasta=2020-01-02T00:00:00Z"))
				.andExpect(status().isOk());
		mvc.perform(get(URL + "/mediciones?desde=2020-01-01T00:00:00Z&hasta=2020-01-02T00:00:01Z"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value(containsString("agrupacion=HORA")));
	}

	@Test
	void porHora_permiteHasta31Dias() throws Exception {
		mvc.perform(get(URL + "/mediciones?agrupacion=HORA&desde=2020-01-01T00:00:00Z&hasta=2020-02-01T00:00:00Z"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.series[0].puntos.length()").value(2));
		mvc.perform(get(URL + "/mediciones?agrupacion=HORA&desde=2020-01-01T00:00:00Z&hasta=2020-02-01T00:00:01Z"))
				.andExpect(status().isBadRequest());
	}

	// --- PATCH ---------------------------------------------------------------

	@Test
	void patch_cambiaSoloLosCamposEnviados() throws Exception {
		mvc.perform(patch(URL).contentType(MediaType.APPLICATION_JSON)
				.content("{ \"riegoAutomatico\": false, \"umbralRiego\": 40 }"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.riegoAutomatico").value(false))
				.andExpect(jsonPath("$.umbralRiego").value(40.0))
				.andExpect(jsonPath("$.duracionRiegoSeg").value(5))
				.andExpect(jsonPath("$.tieneBomba").value(true));
	}

	@Test
	void patch_sinBomba_noHayRiegoAutomaticoDisponible() throws Exception {
		mvc.perform(patch(URL).contentType(MediaType.APPLICATION_JSON).content("{ \"tieneBomba\": false }"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tieneBomba").value(false))
				.andExpect(jsonPath("$.riegoAutomaticoDisponible").value(false));
	}

	@Test
	void patch_errores() throws Exception {
		mvc.perform(patch(URL).contentType(MediaType.APPLICATION_JSON).content("{ \"umbralRiego\": 150 }"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.codigo").value("VALIDACION"));
		mvc.perform(patch(URL).contentType(MediaType.APPLICATION_JSON).content("{ \"duracionRiegoSeg\": 61 }"))
				.andExpect(status().isBadRequest());
		mvc.perform(patch(URL).contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest());
		mvc.perform(patch(URL))
				.andExpect(status().isBadRequest());
		mvc.perform(patch("/api/dispositivos/maceta-99").contentType(MediaType.APPLICATION_JSON)
				.content("{ \"tieneBomba\": false }"))
				.andExpect(status().isNotFound());
	}

}

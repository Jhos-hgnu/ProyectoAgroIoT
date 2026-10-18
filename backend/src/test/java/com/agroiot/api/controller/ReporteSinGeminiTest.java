package com.agroiot.api.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Fase 6: sin GEMINI_API_KEY la API arranca igual y el reporte responde 502 IA_NO_DISPONIBLE. */
@SpringBootTest(properties = "agroiot.gemini.api-key=")
@AutoConfigureMockMvc
@Transactional
class ReporteSinGeminiTest {

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Test
	void sinKey_502() throws Exception {
		// 10 mediciones de hace 30 min, para pasar la validación de datos suficientes.
		jdbc.update("""
				WITH l AS (
				    INSERT INTO lectura (dispositivo_id, medida_en, recibida_en)
				    SELECT 'maceta-01', now() - INTERVAL '30 minutes' + i * INTERVAL '1 minute', now()
				    FROM generate_series(1, 10) AS i
				    RETURNING id)
				INSERT INTO medicion (lectura_id, tipo_sensor, valor) SELECT id, 'TEMPERATURA', 24 FROM l""");

		mvc.perform(post("/api/dispositivos/maceta-01/reportes"))
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.codigo").value("IA_NO_DISPONIBLE"))
				.andExpect(jsonPath("$.mensaje").value("La IA no está configurada (falta GEMINI_API_KEY)"));
	}

}

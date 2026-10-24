package com.agroiot.api.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * GET y POST /dispositivos (alta de macetas desde el frontend). Cada prueba se revierte al terminar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DispositivosColeccionTest {

	@Autowired
	private MockMvc mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Test
	void listar_incluyeMaceta01() throws Exception {
		mvc.perform(get("/api/dispositivos"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("maceta-01"));
	}

	@Test
	void crear_asignaElSiguienteCorrelativoYGuardaLosDatos() throws Exception {
		mvc.perform(post("/api/dispositivos").contentType(MediaType.APPLICATION_JSON)
				.content("{\"cultivo\":\" Lechuga Hidropónica \",\"zona\":\"ZONA B\",\"sector\":\"SECTOR #2\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("maceta-02"))
				.andExpect(jsonPath("$.nombre").value("Maceta 02 — Lechuga Hidropónica"))
				.andExpect(jsonPath("$.cultivo").value("Lechuga Hidropónica"))
				.andExpect(jsonPath("$.zona").value("ZONA B"))
				.andExpect(jsonPath("$.sector").value("SECTOR #2"))
				.andExpect(jsonPath("$.ubicacion").value("ZONA B · SECTOR #2"))
				.andExpect(jsonPath("$.tieneBomba").value(true))
				.andExpect(jsonPath("$.conectado").value(false))
				.andExpect(jsonPath("$.sensores.length()").value(0));

		mvc.perform(get("/api/dispositivos/maceta-02")).andExpect(status().isOk());

		mvc.perform(post("/api/dispositivos").contentType(MediaType.APPLICATION_JSON)
				.content("{\"cultivo\":\"Albahaca\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("maceta-03"))
				.andExpect(jsonPath("$.zona").doesNotExist());
	}

	@Test
	void crear_usaElMayorCorrelativoAunqueHayaHuecos() throws Exception {
		jdbc.update("INSERT INTO dispositivo (id, nombre) VALUES ('maceta-07', 'Maceta 07')");
		mvc.perform(post("/api/dispositivos").contentType(MediaType.APPLICATION_JSON)
				.content("{\"cultivo\":\"Tomate\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("maceta-08"));
	}

	@Test
	void crear_sinCultivo_esUnaValidacion() throws Exception {
		mvc.perform(post("/api/dispositivos").contentType(MediaType.APPLICATION_JSON)
				.content("{\"cultivo\":\"  \",\"zona\":\"ZONA A\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.codigo").value("VALIDACION"));
	}

}

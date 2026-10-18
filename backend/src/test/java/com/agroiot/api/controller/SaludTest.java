package com.agroiot.api.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Fase 5: sin FIREBASE_DB_URL la API funciona igual y /salud dice NO_CONFIGURADO. */
@SpringBootTest(properties = "agroiot.firebase.db-url=")
@AutoConfigureMockMvc
class SaludTest {

	@Autowired
	private MockMvc mvc;

	@Test
	void sinFirebaseConfiguradoLaApiEstaOk() throws Exception {
		mvc.perform(get("/api/salud"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("OK"))
				.andExpect(jsonPath("$.baseDatos").value("OK"))
				.andExpect(jsonPath("$.firebase").value("NO_CONFIGURADO"));
	}

}

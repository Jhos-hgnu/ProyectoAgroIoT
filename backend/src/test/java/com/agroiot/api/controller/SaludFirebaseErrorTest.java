package com.agroiot.api.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Fase 5: Firebase configurado pero sin credenciales. La API arranca igual y /salud responde 200 con
 * firebase = ERROR y estado = DEGRADADO.
 */
@SpringBootTest(properties = {
		"agroiot.firebase.db-url=https://demo-agroiot-default-rtdb.firebaseio.com",
		"agroiot.firebase.credentials=" })
@AutoConfigureMockMvc
class SaludFirebaseErrorTest {

	@Autowired
	private MockMvc mvc;

	@Test
	void firebaseSinCredencialesDegradaLaSalud() throws Exception {
		mvc.perform(get("/api/salud"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("DEGRADADO"))
				.andExpect(jsonPath("$.baseDatos").value("OK"))
				.andExpect(jsonPath("$.firebase").value("ERROR"));
	}

}

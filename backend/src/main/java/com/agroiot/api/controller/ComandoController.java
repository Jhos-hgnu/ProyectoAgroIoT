package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.ConfirmacionRequest;
import com.agroiot.api.dto.ConfirmacionResponse;
import com.agroiot.api.exception.ApiException;

@RestController
@RequestMapping("/api/comandos")
public class ComandoController {

	/** ESP32 (X-Api-Key). */
	@PostMapping("/{comandoId}/confirmacion")
	public ConfirmacionResponse confirmar(@PathVariable Long comandoId,
			@RequestBody(required = false) ConfirmacionRequest req) {
		throw ApiException.noImplementado("POST /comandos/{comandoId}/confirmacion");
	}

}

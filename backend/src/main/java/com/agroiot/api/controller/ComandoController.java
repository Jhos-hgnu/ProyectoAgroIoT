package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.ConfirmacionRequest;
import com.agroiot.api.dto.ConfirmacionResponse;
import com.agroiot.api.service.RiegoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/comandos")
public class ComandoController {

	private final RiegoService riegos;

	public ComandoController(RiegoService riegos) {
		this.riegos = riegos;
	}

	/** ESP32 (X-Api-Key). estado = EJECUTADO | FALLIDO. */
	@PostMapping("/{comandoId}/confirmacion")
	public ConfirmacionResponse confirmar(@PathVariable Long comandoId, @Valid @RequestBody ConfirmacionRequest req) {
		return riegos.confirmar(comandoId, req);
	}

}

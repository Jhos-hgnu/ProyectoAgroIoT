package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.AlertaResponse;
import com.agroiot.api.service.AlertaService;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

	private final AlertaService alertas;

	public AlertaController(AlertaService alertas) {
		this.alertas = alertas;
	}

	/** Sin cuerpo. Devuelve la alerta con resueltaEn lleno. */
	@PostMapping("/{id}/resolver")
	public AlertaResponse resolver(@PathVariable Long id) {
		return alertas.resolver(id);
	}

}

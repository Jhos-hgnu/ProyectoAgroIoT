package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.SaludResponse;
import com.agroiot.api.service.SaludService;

@RestController
@RequestMapping("/api")
public class SaludController {

	private final SaludService salud;

	public SaludController(SaludService salud) {
		this.salud = salud;
	}

	/** Siempre 200; si algo falla, estado = DEGRADADO. */
	@GetMapping("/salud")
	public SaludResponse salud() {
		return salud.revisar();
	}

}

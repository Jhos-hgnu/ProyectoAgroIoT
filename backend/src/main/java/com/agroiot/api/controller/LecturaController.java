package com.agroiot.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.LecturaRequest;
import com.agroiot.api.dto.LecturaResponse;
import com.agroiot.api.service.LecturaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class LecturaController {

	private final LecturaService lecturas;

	public LecturaController(LecturaService lecturas) {
		this.lecturas = lecturas;
	}

	/** ESP32 (X-Api-Key). */
	@PostMapping("/lecturas")
	@ResponseStatus(HttpStatus.CREATED)
	public LecturaResponse registrar(@Valid @RequestBody LecturaRequest req) {
		return lecturas.registrar(req);
	}

}

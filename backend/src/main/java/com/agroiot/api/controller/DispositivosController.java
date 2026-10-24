package com.agroiot.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.DispositivoCrearRequest;
import com.agroiot.api.dto.DispositivoResponse;
import com.agroiot.api.service.DispositivoService;

import jakarta.validation.Valid;

/** La colección de macetas. Cada maceta se consulta en /dispositivos/{id} (DispositivoController). */
@RestController
@RequestMapping("/api/dispositivos")
public class DispositivosController {

	private final DispositivoService dispositivos;

	public DispositivosController(DispositivoService dispositivos) {
		this.dispositivos = dispositivos;
	}

	@GetMapping
	public List<DispositivoResponse> listar() {
		return dispositivos.listar();
	}

	/** Botón "Agregar maceta". 201 con la maceta creada; el id lo asigna la API. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public DispositivoResponse crear(@Valid @RequestBody DispositivoCrearRequest req) {
		return dispositivos.crear(req);
	}

}

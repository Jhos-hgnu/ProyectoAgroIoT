package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.ReporteResponse;
import com.agroiot.api.exception.ApiException;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

	@GetMapping("/{id}")
	public ReporteResponse obtener(@PathVariable Long id) {
		throw ApiException.noImplementado("GET /reportes/{id}");
	}

}

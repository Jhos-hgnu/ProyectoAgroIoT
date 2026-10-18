package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.ReporteResponse;
import com.agroiot.api.service.ReporteService;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

	private final ReporteService reportes;

	public ReporteController(ReporteService reportes) {
		this.reportes = reportes;
	}

	@GetMapping("/{id}")
	public ReporteResponse obtener(@PathVariable Long id) {
		return reportes.obtener(id);
	}

}

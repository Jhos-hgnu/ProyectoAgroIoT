package com.agroiot.api.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.AlertaResponse;
import com.agroiot.api.exception.ApiException;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

	@PostMapping("/{id}/resolver")
	public AlertaResponse resolver(@PathVariable Long id) {
		throw ApiException.noImplementado("POST /alertas/{id}/resolver");
	}

}
